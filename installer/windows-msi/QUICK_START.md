# Quick Start - Build MSI Installer in 5 Minutes

## Step 1: Install WiX Toolset

Download and install WiX Toolset 3.11 or later:
- https://wixtoolset.org/releases/

Or install via .NET:
```cmd
dotnet tool install --global wix
```

## Step 2: Build the MSI

Open Command Prompt and run:

```cmd
cd installer\windows-msi
build.bat
```

That's it! The script will:
- ✅ Download Python 3.11.9 (~12 MB)
- ✅ Install all dependencies automatically
- ✅ Download NSSM service manager
- ✅ Build the complete MSI installer

## Step 3: Find Your MSI

The installer will be created at:
```
installer\windows-msi\output\ITMonitoringAgent-1.0.0.msi
```

## Quick Test

Double-click the MSI to test the installation wizard!

## Build with Custom Version

```cmd
build.bat --version 1.2.3
```

## Silent Install (for testing)

```cmd
cd output
msiexec /i ITMonitoringAgent-1.0.0.msi ^
  BACKENDURL="http://localhost:5001/api/monitoring/events" ^
  REGISTRATIONURL="http://localhost:5001/api/monitoring/register" ^
  /quiet /norestart
```

## Check Service

```cmd
sc query ITMonitoringAgent
```

## View Logs

```cmd
type "C:\Program Files\ITMonitoringAgent\logs\monitoring_agent.log"
```

## Uninstall

```cmd
msiexec /x ITMonitoringAgent-1.0.0.msi /quiet /norestart
```

---

## Troubleshooting

**"WiX Toolset not found"**
- Install WiX from https://wixtoolset.org/releases/
- Restart Command Prompt after installation

**"Failed to download Python"**
- Check internet connection
- Or download Python manually and use `build.bat --skip-python`

**"Service won't start"**
- Check `C:\Program Files\ITMonitoringAgent\logs\service_error.log`
- Verify backend URL is accessible
- Check Windows Event Viewer → Application logs

---

## Next Steps

For detailed information:
- Read `PRODUCTION_BUILD_GUIDE.md` for comprehensive documentation
- Read `DEPLOYMENT_GUIDE.md` for enterprise deployment
- Read `README.txt` for end-user documentation

## Support

For issues or questions:
- Check the troubleshooting section in `PRODUCTION_BUILD_GUIDE.md`
- Review build logs in the console output
- Contact your IT Operations team

