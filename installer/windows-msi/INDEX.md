# IT Management Monitoring Agent - MSI Installer Documentation Index

## 📚 Complete Documentation Suite

Welcome to the IT Management Monitoring Agent MSI Installer documentation. This index helps you find the right document for your needs.

---

## 🎯 Choose Your Path

### 👤 I want to build the MSI installer

**Start here:** [QUICK_START.md](QUICK_START.md) - Build your first MSI in 5 minutes

Then read: [PRODUCTION_BUILD_GUIDE.md](PRODUCTION_BUILD_GUIDE.md) - Complete build documentation

---

### 🚀 I want to deploy to production

**Start here:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Enterprise deployment methods

Also review: [README_MSI_INSTALLER.md](README_MSI_INSTALLER.md) - Complete overview

---

### 🔧 I want to customize the installer

**Start here:** [PRODUCTION_BUILD_GUIDE.md](PRODUCTION_BUILD_GUIDE.md) - Section: "Customization"

Then edit: [Product.wxs](Product.wxs) and [InstallHelper.ps1](InstallHelper.ps1)

---

### 🧪 I want to test the installer

**Start here:** Run `test-install.ps1` - Automated test suite

Then read: [PRODUCTION_BUILD_GUIDE.md](PRODUCTION_BUILD_GUIDE.md) - Section: "Testing the MSI"

---

### 📖 I'm an end user who installed this

**Read:** [README.txt](README.txt) - End-user documentation

---

## 📄 All Documents

### Quick Reference

| Document | Purpose | Audience | Length |
|----------|---------|----------|--------|
| **[README_MSI_INSTALLER.md](README_MSI_INSTALLER.md)** | Complete overview and reference | Everyone | 10 min |
| **[QUICK_START.md](QUICK_START.md)** | Build your first MSI | Builders | 5 min |
| **[PRODUCTION_BUILD_GUIDE.md](PRODUCTION_BUILD_GUIDE.md)** | Comprehensive build guide | Builders, DevOps | 30 min |
| **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** | Enterprise deployment | IT Admins, DevOps | 20 min |
| **[README.txt](README.txt)** | End-user documentation | End Users | 10 min |
| **[License.txt](License.txt)** | License agreement | Legal, Users | 5 min |
| **[INDEX.md](INDEX.md)** | This file - documentation index | Everyone | 2 min |

---

## 🛠️ Technical Files

### Build Scripts

- **[Build-Production-MSI.ps1](Build-Production-MSI.ps1)** - Main build script
  - Downloads Python embeddable distribution
  - Installs pip and dependencies
  - Downloads NSSM
  - Compiles WiX sources
  - Creates final MSI

- **[build.bat](build.bat)** - Simple wrapper for Build-Production-MSI.ps1
  - Easy command-line interface
  - Handles common build scenarios

### WiX Source Files

- **[Product.wxs](Product.wxs)** - Main installer definition
  - Product information
  - Directory structure
  - Components and features
  - Custom actions
  - Installation sequence

- **[CustomUI.wxs](CustomUI.wxs)** - Custom wizard UI
  - Welcome dialog
  - License agreement
  - Configuration dialog
  - Progress dialog
  - Finish dialog

### Installation Helpers

- **[InstallHelper.ps1](InstallHelper.ps1)** - PowerShell helper for custom actions
  - Creates config.json
  - Creates Windows service with NSSM
  - Starts service
  - Removes service on uninstall
  - Configures firewall

- **[service_wrapper.py](service_wrapper.py)** - Python Windows service wrapper
  - pywin32-based service implementation
  - Fallback if NSSM not available
  - Service lifecycle management

### Testing

- **[test-install.ps1](test-install.ps1)** - Installation test suite
  - Interactive installation test
  - Silent installation test
  - Custom parameters test
  - Installation verification
  - Uninstallation test

---

## 📊 Build Output

After running `build.bat`, you'll find:

```
installer/windows-msi/
├── python/                    # Bundled Python 3.11.9
├── obj/                       # Build artifacts
│   ├── Product.wixobj
│   ├── CustomUI.wixobj
│   └── Python.wixobj
└── output/                    # Final MSI
    └── ITMonitoringAgent-1.0.0.msi  ← Your installer!
```

---

## 🎓 Learning Path

### Beginner (Just want to build)

1. Read [QUICK_START.md](QUICK_START.md)
2. Run `build.bat`
3. Test the MSI on a VM
4. Done! 🎉

### Intermediate (Want to deploy)

1. Read [QUICK_START.md](QUICK_START.md)
2. Build the MSI
3. Read [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
4. Choose deployment method (GPO/Intune/SCCM)
5. Pilot with small group
6. Full deployment

### Advanced (Want to customize)

1. Read [README_MSI_INSTALLER.md](README_MSI_INSTALLER.md)
2. Read [PRODUCTION_BUILD_GUIDE.md](PRODUCTION_BUILD_GUIDE.md)
3. Understand WiX basics
4. Customize [Product.wxs](Product.wxs)
5. Modify [InstallHelper.ps1](InstallHelper.ps1)
6. Test thoroughly
7. Deploy

### Expert (Want to integrate with CI/CD)

1. All of the above
2. Read [PRODUCTION_BUILD_GUIDE.md](PRODUCTION_BUILD_GUIDE.md) - Section: "Advanced Topics"
3. Integrate with Azure DevOps / GitHub Actions
4. Automate testing with Pester
5. Code signing automation
6. Automated deployment pipelines

---

## 🔍 Quick Find

### How do I...?

**Build the MSI?**
→ [QUICK_START.md](QUICK_START.md)

**Change the version number?**
→ `build.bat --version 1.2.3`

**Deploy to 1000+ computers?**
→ [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Section: "Group Policy"

**Customize the backend URL?**
→ [PRODUCTION_BUILD_GUIDE.md](PRODUCTION_BUILD_GUIDE.md) - Section: "Customization"

**Test the installer?**
→ Run `test-install.ps1` or see [PRODUCTION_BUILD_GUIDE.md](PRODUCTION_BUILD_GUIDE.md) - Section: "Testing"

**Sign the MSI?**
→ [PRODUCTION_BUILD_GUIDE.md](PRODUCTION_BUILD_GUIDE.md) - Section: "Code Signing"

**Troubleshoot build errors?**
→ [PRODUCTION_BUILD_GUIDE.md](PRODUCTION_BUILD_GUIDE.md) - Section: "Troubleshooting"

**Troubleshoot installation errors?**
→ [PRODUCTION_BUILD_GUIDE.md](PRODUCTION_BUILD_GUIDE.md) - Section: "Troubleshooting"

**Uninstall the agent?**
→ [README.txt](README.txt) - Section: "UNINSTALLING"

**Add company branding?**
→ [PRODUCTION_BUILD_GUIDE.md](PRODUCTION_BUILD_GUIDE.md) - Section: "Customization"

---

## 🎯 By Role

### DevOps / Build Engineer

1. [Build-Production-MSI.ps1](Build-Production-MSI.ps1) - Main build script
2. [PRODUCTION_BUILD_GUIDE.md](PRODUCTION_BUILD_GUIDE.md) - Complete build guide
3. [test-install.ps1](test-install.ps1) - Automated testing

### IT Administrator

1. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deployment methods
2. [README_MSI_INSTALLER.md](README_MSI_INSTALLER.md) - Complete overview
3. [README.txt](README.txt) - End-user documentation (for help desk)

### Software Developer

1. [Product.wxs](Product.wxs) - WiX installer definition
2. [InstallHelper.ps1](InstallHelper.ps1) - Custom actions
3. [service_wrapper.py](service_wrapper.py) - Service implementation
4. [PRODUCTION_BUILD_GUIDE.md](PRODUCTION_BUILD_GUIDE.md) - Technical details

### End User

1. [README.txt](README.txt) - Everything you need to know
2. [License.txt](License.txt) - License agreement

### Manager / Project Lead

1. [README_MSI_INSTALLER.md](README_MSI_INSTALLER.md) - Executive summary
2. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deployment planning

---

## 📞 Support Resources

### Internal

- **IT Operations:** it-operations@company.com
- **Help Desk:** Extension 5555
- **Wiki:** https://wiki.company.com/it-monitoring

### External

- **WiX Toolset:** https://wixtoolset.org/documentation/
- **Python:** https://docs.python.org/3/
- **NSSM:** https://nssm.cc/usage

---

## ✅ Quick Command Reference

### Build

```cmd
# Basic build
build.bat

# Custom version
build.bat --version 1.2.3

# With cleanup
build.bat --clean

# Skip Python download (use cached)
build.bat --skip-python
```

### Install

```cmd
# Interactive
msiexec /i ITMonitoringAgent-1.0.0.msi

# Silent
msiexec /i ITMonitoringAgent-1.0.0.msi /quiet /norestart

# With custom parameters
msiexec /i ITMonitoringAgent-1.0.0.msi BACKENDURL="..." REGISTRATIONTOKEN="..." /quiet
```

### Test

```powershell
# Run all tests
.\test-install.ps1 -TestMode All

# Silent install test
.\test-install.ps1 -TestMode Silent

# Interactive test
.\test-install.ps1 -TestMode Interactive
```

### Verify

```cmd
# Check service
sc query ITMonitoringAgent

# View logs
type "C:\Program Files\ITMonitoringAgent\logs\monitoring_agent.log"

# Check registry
reg query HKLM\SOFTWARE\ITMonitoringAgent
```

### Uninstall

```cmd
# Silent uninstall
msiexec /x ITMonitoringAgent-1.0.0.msi /quiet /norestart
```

---

## 📈 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2024-10 | Complete rewrite with bundled Python |
| 1.0.0 | 2024 | Initial MSI implementation |

---

## 🎉 Get Started

The fastest way to get started:

```cmd
cd installer\windows-msi
build.bat
```

Then read [QUICK_START.md](QUICK_START.md) while it builds!

---

**Need help?** Start with [README_MSI_INSTALLER.md](README_MSI_INSTALLER.md) for a complete overview.

**Ready to deploy?** Go to [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

**Have questions?** Contact IT Operations at it-operations@company.com

---

*Last updated: October 2024*  
*Maintained by: IT Operations Team*

