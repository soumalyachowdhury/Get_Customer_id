$Query = Read-Host "Name or phone number"
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
    ($LooksLikePhoneNumber -and $CustomerPhoneNumber -eq $SearchPhoneNumber) -or
        ($SearchText -and $CustomerName.Contains($SearchText))
} | ForEach-Object {
    [PSCustomObject]@{
        customer_id = $_."Customer ID"
        loyalty_id = $_."Loyalty ID"
        coupon = [PSCustomObject]@{
            active = $_."Active Coupon"
            offer = $_."Coupon"
            details = $_."Coupon Details"
            valid_from = $_."Coupon Valid From"
            valid_until = $_."Coupon Valid Until"
        }
        meal_preference = $_."Dietary Preference"
    }
}

[PSCustomObject]@{
    message = if ($Matches.Count) { "$($Matches.Count) customer match$(if ($Matches.Count -eq 1) { '' } else { 'es' }) found." } else { "No customer found for that search." }
    query = $Query
    matches = @($Matches)
} | ConvertTo-Json -Depth 4
