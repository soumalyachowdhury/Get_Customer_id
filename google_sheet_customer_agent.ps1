$Query = Read-Host "Customer ID, loyalty ID, name, or phone number"
$SpreadsheetId = "1NDTklJxtW9jLJYtqh9v-lXN1O_-6lEXi0MalVzL_QeQ"
$Gid = "1037034171"
$CsvUrl = "https://docs.google.com/spreadsheets/d/$SpreadsheetId/export?format=csv&gid=$Gid"

$ErrorActionPreference = "Stop"

$CsvText = Invoke-WebRequest -Uri $CsvUrl -UseBasicParsing | Select-Object -ExpandProperty Content
$Rows = $CsvText | ConvertFrom-Csv
$SearchText = ($Query.Trim() -replace "\s+", " ").ToLower()
$SearchPhoneNumber = $Query -replace "\D", ""
$LooksLikePhoneNumber = $SearchPhoneNumber.Length -ge 7

$Matches = $Rows | Where-Object {
    $CustomerName = (($_."Customer Name").Trim() -replace "\s+", " ").ToLower()
    $CustomerPhoneNumber = $_."Phone Number" -replace "\D", ""
    $CustomerId = (($_."Customer ID").Trim() -replace "\s+", " ").ToLower()
    $LoyaltyId = (($_."Loyalty ID").Trim() -replace "\s+", " ").ToLower()
    ($LooksLikePhoneNumber -and $CustomerPhoneNumber -eq $SearchPhoneNumber) -or
        ($SearchText -and (
            $CustomerName.Contains($SearchText) -or
            $CustomerId -eq $SearchText -or
            $LoyaltyId -eq $SearchText
        ))
} | ForEach-Object {
    $Record = [ordered]@{}
    $_.PSObject.Properties | ForEach-Object {
        $Record[$_.Name] = if ($_.Value -eq "") { $null } else { $_.Value }
    }
    [PSCustomObject]$Record
}

[PSCustomObject]@{
    message = if ($Matches.Count) { "$($Matches.Count) customer match$(if ($Matches.Count -eq 1) { '' } else { 'es' }) found." } else { "No customer found for that search." }
    query = $Query
    matches = @($Matches)
} | ConvertTo-Json -Depth 6
