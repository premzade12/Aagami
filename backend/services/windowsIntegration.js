import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class WindowsIntegrationService {
  constructor() {
    this.isWindows = process.platform === 'win32';
  }

  // Check if WhatsApp Desktop is running
  async isWhatsAppRunning() {
    if (!this.isWindows) return false;
    
    try {
      const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq WhatsApp.exe" /FO CSV');
      return stdout.includes('WhatsApp.exe');
    } catch (error) {
      console.error('Error checking WhatsApp process:', error);
      return false;
    }
  }

  // Get WhatsApp window title (contains unread count)
  async getWhatsAppWindowTitle() {
    if (!this.isWindows) return null;
    
    try {
      // PowerShell command to get WhatsApp window title
      const psCommand = `
        Get-Process | Where-Object {$_.ProcessName -eq "WhatsApp"} | 
        ForEach-Object {$_.MainWindowTitle}
      `;
      
      const { stdout } = await execAsync(`powershell -Command "${psCommand}"`);
      return stdout.trim();
    } catch (error) {
      console.error('Error getting WhatsApp window title:', error);
      return null;
    }
  }

  // Monitor Windows notifications using PowerShell
  startNotificationMonitoring(callback) {
    if (!this.isWindows) return null;
    
    // PowerShell script to monitor toast notifications
    const psScript = `
      Register-WmiEvent -Query "SELECT * FROM Win32_VolumeChangeEvent WHERE EventType = 2" -Action {
        $Event = $Event.SourceEventArgs.NewEvent
        Write-Host "Notification: $($Event.TargetInstance.Label)"
      }
      
      # Keep the script running
      while ($true) {
        Start-Sleep -Seconds 1
      }
    `;
    
    const psProcess = spawn('powershell', ['-Command', psScript], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    psProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('WhatsApp')) {
        callback(output);
      }
    });
    
    return psProcess;
  }

  // Get system notifications from Windows Event Log
  async getRecentNotifications() {
    if (!this.isWindows) return [];
    
    try {
      const psCommand = `
        Get-WinEvent -FilterHashtable @{LogName='Application'; ID=1000} -MaxEvents 50 | 
        Where-Object {$_.Message -like "*WhatsApp*"} | 
        Select-Object TimeCreated, Message | 
        ConvertTo-Json
      `;
      
      const { stdout } = await execAsync(`powershell -Command "${psCommand}"`);
      return JSON.parse(stdout || '[]');
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Focus WhatsApp window
  async focusWhatsApp() {
    if (!this.isWindows) return false;
    
    try {
      const psCommand = `
        $whatsapp = Get-Process | Where-Object {$_.ProcessName -eq "WhatsApp"}
        if ($whatsapp) {
          Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class Win32 { [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd); }'
          [Win32]::SetForegroundWindow($whatsapp.MainWindowHandle)
          return $true
        }
        return $false
      `;
      
      const { stdout } = await execAsync(`powershell -Command "${psCommand}"`);
      return stdout.trim() === 'True';
    } catch (error) {
      console.error('Error focusing WhatsApp:', error);
      return false;
    }
  }

  // Send message via WhatsApp (requires WhatsApp to be open)
  async sendMessage(contact, message) {
    if (!this.isWindows) return false;
    
    try {
      // This would require WhatsApp API or automation
      // For now, we'll focus the window and let user type
      await this.focusWhatsApp();
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }
}

export default new WindowsIntegrationService();