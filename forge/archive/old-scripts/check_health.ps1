$r = Invoke-WebRequest -Uri 'https://forge-production-2692.up.railway.app/health' -UseBasicParsing
$r.Content | Set-Content 'C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\health_result.txt'
