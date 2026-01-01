# 🎯 NetProbe - Network Security Assessment Tool

<div align="center">

**Professional network reconnaissance and security assessment tool with cloud data persistence**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)

[🚀 Live Demo](https://netprobe-two.vercel.app) • [📖 Documentation](.docs/) • [🐛 Report Issues](https://github.com/zanesense/netprobe/issues)

</div>

---

## ✨ What is NetProbe?

NetProbe is a **browser-based network security assessment tool** that allows security professionals and network administrators to perform comprehensive network reconnaissance safely and legally. Built with modern web technologies, it provides enterprise-grade scanning capabilities with cloud data persistence.

### 🎯 **Key Features**

- **🔐 Secure Authentication** - Sign up with email or social providers (Google, GitHub)
- **🔍 Network Scanning** - Port scanning, host discovery, service detection
- **💾 Cloud Storage** - All scan results automatically saved to your account
- **📊 Professional Reports** - Export results in PDF, CSV, or JSON formats
- **🌐 Cross-Device Access** - Access your scans from anywhere
- **🛡️ Security Focused** - Built for authorized testing with compliance features

---

## 🚀 Getting Started

### 1. **Access NetProbe**
Visit the application and create your account:
- **Sign up** with email and password
- **Or use social login** (Google/GitHub)
- **Verify your email** to access all features

### 2. **Start Scanning**
```
1. Enter target: 192.168.1.1 or example.com
2. Set port range: 1-1000  
3. Choose scan type: TCP Connect
4. Click "Start Scan" 🚀
```

### 3. **View Results**
- **Real-time progress** with live updates
- **Detailed results** showing open ports and services
- **Automatic saving** to your cloud account
- **Export reports** in multiple formats

---

## 🔧 Core Capabilities

### **Network Scanning**
- **Port Scanning** - TCP Connect, SYN, UDP scanning methods
- **Host Discovery** - Multiple discovery techniques (ICMP, TCP, ARP)
- **Service Detection** - Identify services running on open ports
- **OS Fingerprinting** - Determine target operating systems
- **DNS Resolution** - Comprehensive hostname lookup

### **Security Analysis**
- **Firewall Detection** - Identify filtering and security measures
- **Security Scripts** - Run automated security checks
- **Vulnerability Assessment** - Basic security posture analysis
- **Compliance Reporting** - Generate professional security reports

### **Data Management**
- **Cloud Storage** - All scans saved to Firebase Firestore
- **Scan History** - Access previous scans across devices
- **User Profiles** - Personalized settings and preferences
- **Export Options** - PDF, CSV, JSON report formats

---

## 🛡️ Security & Compliance

### **Legal Use Only**
⚖️ **IMPORTANT**: NetProbe is designed for **authorized security testing only**. Users must:
- Own the target systems OR have explicit written permission
- Comply with all local laws and regulations
- Use responsibly for legitimate security purposes only

### **Built-in Safety**
- **Authorization Notices** - Required compliance acceptance
- **Audit Logging** - Complete activity tracking
- **Safe Operations** - Read-only scanning, no exploitation
- **Rate Limiting** - Prevents overwhelming target systems

---

## 🏗️ For Developers

### **Local Development**
```bash
# Clone and setup
git clone https://github.com/zanesense/netprobe.git
cd netprobe
npm install

# Configure environment
cp .env.example .env
# Add your Firebase configuration

# Start development server
npm run dev
```

### **Tech Stack**
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Firebase (Auth + Firestore)
- **Build**: Vite for fast development and production builds
- **UI**: shadcn/ui components with Framer Motion animations

### **Architecture**
- **Browser-based scanning** within security constraints
- **Real-time WebSocket** connections for port testing
- **Firebase integration** for authentication and data storage
- **Responsive design** for desktop and mobile use

---

## 🌐 Browser Limitations

NetProbe operates within browser security constraints:

### ✅ **What Works**
- HTTP/HTTPS port detection
- WebSocket connection testing  
- Service banner grabbing
- Basic connectivity testing
- DNS resolution

### ⚠️ **Browser Restrictions**
- Raw socket access (true SYN/ACK scans)
- ICMP ping operations
- Comprehensive UDP scanning
- Network interface enumeration

> 💡 **Note**: For advanced scanning, use native tools like Nmap alongside NetProbe

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Nmap](https://nmap.org/)** - Inspiration for scanning techniques
- **[Firebase](https://firebase.google.com/)** - Authentication and data storage
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful UI components
- **Security Community** - For responsible disclosure practices

---

<div align="center">

**⭐ Star this repo if NetProbe helped you! ⭐**

Made with ❤️ for the security community.

</div>
