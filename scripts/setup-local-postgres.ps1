param(
  [string]$PostgresBin = "C:\Program Files\PostgreSQL\16\bin",
  [string]$HostName = "localhost",
  [int]$Port = 5432,
  [string]$SuperUser = "postgres",
  [string]$SuperPassword = "homologa_local_only",
  [string]$AppUser = "homologa",
  [string]$AppPassword = "homologa_local_only",
  [string]$Database = "homologa"
)

$ErrorActionPreference = "Stop"

$psql = Join-Path $PostgresBin "psql.exe"
if (-not (Test-Path -LiteralPath $psql)) {
  throw "No se encontro psql.exe en $PostgresBin. Instala PostgreSQL 16 o pasa -PostgresBin."
}

$currentUserPath = [Environment]::GetEnvironmentVariable("Path", "User")
if (($currentUserPath -split ";") -notcontains $PostgresBin) {
  try {
    [Environment]::SetEnvironmentVariable("Path", ($currentUserPath.TrimEnd(";") + ";" + $PostgresBin), "User")
    Write-Host "postgres_bin_added_to_user_path $PostgresBin"
  } catch {
    Write-Warning "No se pudo persistir PATH de usuario. Esta ejecucion usara PATH de proceso."
  }
}

if (($env:Path -split ";") -notcontains $PostgresBin) {
  $env:Path = $env:Path.TrimEnd(";") + ";" + $PostgresBin
}

$env:PGPASSWORD = $SuperPassword
& $psql -U $SuperUser -h $HostName -p $Port -d postgres -v ON_ERROR_STOP=1 -c "select version();" | Out-Host

$roleSql = @"
do `$`$
begin
  if not exists (select from pg_roles where rolname = '$AppUser') then
    create role $AppUser login password '$AppPassword';
  else
    alter role $AppUser with login password '$AppPassword';
  end if;
end
`$`$;
"@

& $psql -U $SuperUser -h $HostName -p $Port -d postgres -v ON_ERROR_STOP=1 -c $roleSql | Out-Host

$exists = & $psql -U $SuperUser -h $HostName -p $Port -d postgres -Atc "select 1 from pg_database where datname = '$Database';"
if ($exists -ne "1") {
  & $psql -U $SuperUser -h $HostName -p $Port -d postgres -v ON_ERROR_STOP=1 -c "create database $Database owner $AppUser encoding 'UTF8';" | Out-Host
} else {
  & $psql -U $SuperUser -h $HostName -p $Port -d postgres -v ON_ERROR_STOP=1 -c "alter database $Database owner to $AppUser;" | Out-Host
}

$env:PGPASSWORD = $AppPassword
& $psql -U $AppUser -h $HostName -p $Port -d $Database -v ON_ERROR_STOP=1 -c "select current_user, current_database();" | Out-Host
Write-Host "local_postgres_ready postgresql://${AppUser}:***@${HostName}:$Port/$Database"
