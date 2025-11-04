param(
    [string]$Message = "Nova demanda atribuída!",
    [string]$User = "Usuário",
    [string]$Title = "Fluxo7 Dev"
)

# Adiciona assembly para MessageBox
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Cria e exibe a notificação
$result = [System.Windows.Forms.MessageBox]::Show(
    $Message, 
    "$Title - $User", 
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Information
)

Write-Host "Notificação enviada para: $User"
Write-Host "Mensagem: $Message"
