package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
	"github.com/shirou/gopsutil/v3/process"
)

// Configuration
type Config struct {
	AgentID           string   `json:"agent_id"`
	BackendURL        string   `json:"backend_url"`
	APIKey            string   `json:"api_key"`
	PollingInterval   int      `json:"polling_interval"`
	WatchedDirectories []string `json:"watched_directories"`
	LogLevel          string   `json:"log_level"`
}

// Telemetry payload
type Telemetry struct {
	AgentID        string          `json:"agent_id"`
	Hostname       string          `json:"hostname"`
	HostIP         string          `json:"host_ip"`
	PublicIP       string          `json:"public_ip"`
	VPN            bool            `json:"vpn"`
	SSID           string          `json:"ssid"`
	Timestamp      time.Time       `json:"timestamp"`
	Metrics        *Metrics        `json:"metrics"`
	Processes      []Process       `json:"processes"`
	FileEvents     []FileEvent     `json:"file_events"`
	Network        []NetworkConn   `json:"network"`
	Domains        []DomainAccess  `json:"domains"`
}

type Metrics struct {
	OS            string  `json:"os"`
	OSVersion     string  `json:"osVersion"`
	AgentVersion  string  `json:"agentVersion"`
	CPU           CPUInfo `json:"cpu"`
	RAM           RAMInfo `json:"ram"`
	Disk          DiskInfo `json:"disk"`
	UptimeS       uint64  `json:"uptime_s"`
	BatteryPct    float64 `json:"battery_pct,omitempty"`
}

type CPUInfo struct {
	Model  string  `json:"model"`
	Cores  int     `json:"cores"`
	Usage  float64 `json:"usage"`
}

type RAMInfo struct {
	Total int     `json:"total"`
	Used  int     `json:"used"`
	Usage float64 `json:"usage"`
}

type DiskInfo struct {
	Total int     `json:"total"`
	Used  int     `json:"used"`
	Usage float64 `json:"usage"`
}

type Process struct {
	PID        int32   `json:"pid"`
	Name       string  `json:"name"`
	Exe        string  `json:"exe"`
	Cmdline    string  `json:"cmdline"`
	User       string  `json:"user"`
	CPUPercent float64 `json:"cpu_percent"`
	MemoryMB   uint64  `json:"memory_mb"`
	CreateTime int64   `json:"create_time"`
	Status     string  `json:"status"`
}

type FileEvent struct {
	Path      string    `json:"path"`
	Operation string    `json:"operation"`
	FileType  string    `json:"file_type"`
	Size      int64     `json:"size"`
	User      string    `json:"user"`
	Process   string    `json:"process"`
	Timestamp time.Time `json:"timestamp"`
}

type NetworkConn struct {
	PID          int32  `json:"pid"`
	Process      string `json:"process"`
	Protocol     string `json:"protocol"`
	LocalAddress string `json:"local_address"`
	LocalPort    uint32 `json:"local_port"`
	RemoteAddress string `json:"remote_address"`
	RemotePort   uint32 `json:"remote_port"`
	BytesRecv    uint64 `json:"bytes_recv"`
	BytesSent    uint64 `json:"bytes_sent"`
	PacketsRecv  uint64 `json:"packets_recv"`
	PacketsSent  uint64 `json:"packets_sent"`
	Timestamp    time.Time `json:"timestamp"`
}

type DomainAccess struct {
	Domain    string    `json:"domain"`
	URL       string    `json:"url,omitempty"`
	Source    string    `json:"source"`
	Frequency int       `json:"frequency"`
	Bytes     uint64    `json:"bytes"`
	Timestamp time.Time `json:"timestamp"`
}

// Global state
var (
	config      Config
	fileEvents  []FileEvent
	devMode     bool
)

func main() {
	// Parse command-line flags
	configPath := flag.String("config", "config.json", "Path to configuration file")
	dev := flag.Bool("dev", false, "Development mode (simulate data)")
	flag.Parse()

	devMode = *dev

	// Load configuration
	if err := loadConfig(*configPath); err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	log.Printf("Starting IT Monitoring Agent v1.0.0")
	log.Printf("Agent ID: %s", config.AgentID)
	log.Printf("Backend URL: %s", config.BackendURL)
	log.Printf("Polling Interval: %d seconds", config.PollingInterval)

	// Start file watchers
	go startFileWatchers()

	// Main collection loop
	ticker := time.NewTicker(time.Duration(config.PollingInterval) * time.Second)
	defer ticker.Stop()

	// Collect and send immediately on startup
	collectAndSend()

	for range ticker.C {
		collectAndSend()
	}
}

func loadConfig(path string) error {
	// Try to load config file
	data, err := os.ReadFile(path)
	if err != nil {
		// Use defaults if config file doesn't exist
		log.Printf("Config file not found, using defaults")
		config = Config{
			AgentID:         generateAgentID(),
			BackendURL:      "http://localhost:5001/api/monitoring/events",
			APIKey:          "default-monitoring-key-change-me",
			PollingInterval: 60,
			WatchedDirectories: []string{
				filepath.Join(os.Getenv("HOME"), "Desktop"),
				filepath.Join(os.Getenv("HOME"), "Documents"),
				filepath.Join(os.Getenv("HOME"), "Downloads"),
			},
			LogLevel: "INFO",
		}
		return nil
	}

	return json.Unmarshal(data, &config)
}

func generateAgentID() string {
	hostname, _ := os.Hostname()
	return fmt.Sprintf("%s-%d", hostname, time.Now().Unix())
}

func collectAndSend() {
	log.Println("Collecting telemetry...")

	telemetry := Telemetry{
		AgentID:   config.AgentID,
		Timestamp: time.Now(),
	}

	// Collect hostname
	hostname, err := os.Hostname()
	if err == nil {
		telemetry.Hostname = hostname
	}

	// Collect metrics
	telemetry.Metrics = collectMetrics()

	// Collect network context
	telemetry.HostIP = getLocalIP()
	telemetry.PublicIP = getPublicIP()
	telemetry.VPN = detectVPN()
	telemetry.SSID = getWifiSSID()

	// Collect processes
	if !devMode {
		telemetry.Processes = collectProcesses()
	} else {
		telemetry.Processes = simulateProcesses()
	}

	// Collect network connections
	if !devMode {
		telemetry.Network = collectNetworkConnections()
	} else {
		telemetry.Network = simulateNetworkConnections()
	}

	// Collect file events
	telemetry.FileEvents = getFileEvents()

	// Collect domain access (from network connections)
	telemetry.Domains = extractDomains(telemetry.Network)

	// Send telemetry
	if err := sendTelemetry(telemetry); err != nil {
		log.Printf("Error sending telemetry: %v", err)
	} else {
		log.Println("Telemetry sent successfully")
	}
}

func collectMetrics() *Metrics {
	metrics := &Metrics{
		OS:           runtime.GOOS,
		AgentVersion: "1.0.0",
	}

	// OS Version
	if hostInfo, err := host.Info(); err == nil {
		metrics.OSVersion = hostInfo.PlatformVersion
		metrics.UptimeS = hostInfo.Uptime
	}

	// CPU
	if cpuInfo, err := cpu.Info(); err == nil && len(cpuInfo) > 0 {
		metrics.CPU.Model = cpuInfo[0].ModelName
		metrics.CPU.Cores = len(cpuInfo)
	}
	if cpuPercent, err := cpu.Percent(time.Second, false); err == nil && len(cpuPercent) > 0 {
		metrics.CPU.Usage = cpuPercent[0]
	}

	// RAM
	if memInfo, err := mem.VirtualMemory(); err == nil {
		metrics.RAM.Total = int(memInfo.Total / 1024 / 1024) // MB
		metrics.RAM.Used = int(memInfo.Used / 1024 / 1024)
		metrics.RAM.Usage = memInfo.UsedPercent
	}

	// Disk
	if diskInfo, err := disk.Usage("/"); err == nil {
		metrics.Disk.Total = int(diskInfo.Total / 1024 / 1024 / 1024) // GB
		metrics.Disk.Used = int(diskInfo.Used / 1024 / 1024 / 1024)
		metrics.Disk.Usage = diskInfo.UsedPercent
	}

	return metrics
}

func collectProcesses() []Process {
	processes := []Process{}
	
	procs, err := process.Processes()
	if err != nil {
		return processes
	}

	for _, p := range procs {
		name, _ := p.Name()
		exe, _ := p.Exe()
		cmdline, _ := p.Cmdline()
		username, _ := p.Username()
		cpuPercent, _ := p.CPUPercent()
		memInfo, _ := p.MemoryInfo()
		createTime, _ := p.CreateTime()
		status, _ := p.Status()

		var memMB uint64
		if memInfo != nil {
			memMB = memInfo.RSS / 1024 / 1024
		}

		processes = append(processes, Process{
			PID:        p.Pid,
			Name:       name,
			Exe:        exe,
			Cmdline:    cmdline,
			User:       username,
			CPUPercent: cpuPercent,
			MemoryMB:   memMB,
			CreateTime: createTime / 1000, // Convert to seconds
			Status:     status[0],
		})

		// Limit to top 50 processes by memory
		if len(processes) >= 50 {
			break
		}
	}

	return processes
}

func collectNetworkConnections() []NetworkConn {
	connections := []NetworkConn{}
	
	conns, err := net.Connections("all")
	if err != nil {
		return connections
	}

	// Get network IO counters
	ioCounters, _ := net.IOCounters(false)

	for _, conn := range conns {
		if conn.Status != "ESTABLISHED" {
			continue // Only interested in established connections
		}

		var bytesRecv, bytesSent uint64
		if len(ioCounters) > 0 {
			bytesRecv = ioCounters[0].BytesRecv
			bytesSent = ioCounters[0].BytesSent
		}

		// Get process name for this connection
		processName := ""
		if conn.Pid > 0 {
			if p, err := process.NewProcess(conn.Pid); err == nil {
				processName, _ = p.Name()
			}
		}

		connections = append(connections, NetworkConn{
			PID:           conn.Pid,
			Process:       processName,
			Protocol:      getProtocolName(conn.Type),
			LocalAddress:  conn.Laddr.IP,
			LocalPort:     conn.Laddr.Port,
			RemoteAddress: conn.Raddr.IP,
			RemotePort:    conn.Raddr.Port,
			BytesRecv:     bytesRecv,
			BytesSent:     bytesSent,
			Timestamp:     time.Now(),
		})

		// Limit to 100 connections
		if len(connections) >= 100 {
			break
		}
	}

	return connections
}

func getProtocolName(connType uint32) string {
	switch connType {
	case 1:
		return "tcp"
	case 2:
		return "udp"
	default:
		return "other"
	}
}

func extractDomains(connections []NetworkConn) []DomainAccess {
	domainMap := make(map[string]*DomainAccess)

	for _, conn := range connections {
		// Skip local/private IPs
		if isPrivateIP(conn.RemoteAddress) {
			continue
		}

		// For now, use IP as domain (reverse DNS would be done by enrichment worker)
		domain := conn.RemoteAddress

		if _, exists := domainMap[domain]; !exists {
			domainMap[domain] = &DomainAccess{
				Domain:    domain,
				Source:    "agent",
				Frequency: 0,
				Bytes:     0,
				Timestamp: time.Now(),
			}
		}

		domainMap[domain].Frequency++
		domainMap[domain].Bytes += conn.BytesSent + conn.BytesRecv
	}

	domains := []DomainAccess{}
	for _, d := range domainMap {
		domains = append(domains, *d)
	}

	return domains
}

func isPrivateIP(ip string) bool {
	// Simple check for private IP ranges
	return ip == "" || ip == "127.0.0.1" || ip == "::1" || 
		   ip[:4] == "10." || ip[:7] == "192.168" || ip[:3] == "172."
}

func startFileWatchers() {
	if len(config.WatchedDirectories) == 0 {
		return
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Printf("Failed to create file watcher: %v", err)
		return
	}
	defer watcher.Close()

	// Add watched directories
	for _, dir := range config.WatchedDirectories {
		if err := watcher.Add(dir); err != nil {
			log.Printf("Failed to watch directory %s: %v", dir, err)
		} else {
			log.Printf("Watching directory: %s", dir)
		}
	}

	for {
		select {
		case event, ok := <-watcher.Events:
			if !ok {
				return
			}
			handleFileEvent(event)
		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			log.Printf("File watcher error: %v", err)
		}
	}
}

func handleFileEvent(event fsnotify.Event) {
	operation := ""
	
	if event.Op&fsnotify.Create == fsnotify.Create {
		operation = "create"
	} else if event.Op&fsnotify.Write == fsnotify.Write {
		operation = "modify"
	} else if event.Op&fsnotify.Remove == fsnotify.Remove {
		operation = "delete"
	} else if event.Op&fsnotify.Rename == fsnotify.Rename {
		operation = "rename"
	} else {
		return // Ignore other operations
	}

	fileInfo, err := os.Stat(event.Name)
	var size int64
	if err == nil {
		size = fileInfo.Size()
	}

	fileEvent := FileEvent{
		Path:      event.Name,
		Operation: operation,
		FileType:  filepath.Ext(event.Name),
		Size:      size,
		User:      os.Getenv("USER"),
		Timestamp: time.Now(),
	}

	fileEvents = append(fileEvents, fileEvent)

	// Keep only last 100 events
	if len(fileEvents) > 100 {
		fileEvents = fileEvents[len(fileEvents)-100:]
	}
}

func getFileEvents() []FileEvent {
	events := make([]FileEvent, len(fileEvents))
	copy(events, fileEvents)
	fileEvents = []FileEvent{} // Clear for next batch
	return events
}

func getLocalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return ""
	}

	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}

	return ""
}

func getPublicIP() string {
	// Simple HTTP request to get public IP
	resp, err := http.Get("https://api.ipify.org?format=text")
	if err != nil {
		return ""
	}
	defer resp.Body.Close()

	buf := new(bytes.Buffer)
	buf.ReadFrom(resp.Body)
	return buf.String()
}

func detectVPN() bool {
	// Check for common VPN interface names
	ifaces, err := net.Interfaces()
	if err != nil {
		return false
	}

	vpnKeywords := []string{"tun", "tap", "vpn", "ppp", "wg"}
	
	for _, iface := range ifaces {
		name := iface.Name
		for _, keyword := range vpnKeywords {
			if len(name) >= len(keyword) && name[:len(keyword)] == keyword {
				return true
			}
		}
	}

	return false
}

func getWifiSSID() string {
	// Platform-specific SSID detection
	// This is a placeholder - actual implementation varies by OS
	return ""
}

func sendTelemetry(telemetry Telemetry) error {
	data, err := json.Marshal(telemetry)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", config.BackendURL, bytes.NewBuffer(data))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", config.APIKey)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("server returned status %d", resp.StatusCode)
	}

	return nil
}

// Simulation functions for dev mode
func simulateProcesses() []Process {
	return []Process{
		{PID: 1234, Name: "chrome.exe", User: "testuser", CPUPercent: 25.5, MemoryMB: 512, Status: "running"},
		{PID: 5678, Name: "slack.exe", User: "testuser", CPUPercent: 10.2, MemoryMB: 256, Status: "running"},
		{PID: 9012, Name: "node.exe", User: "testuser", CPUPercent: 15.7, MemoryMB: 384, Status: "running"},
	}
}

func simulateNetworkConnections() []NetworkConn {
	return []NetworkConn{
		{PID: 1234, Process: "chrome.exe", Protocol: "tcp", RemoteAddress: "142.250.185.78", RemotePort: 443, BytesSent: 1024000, BytesRecv: 5120000, Timestamp: time.Now()},
		{PID: 5678, Process: "slack.exe", Protocol: "tcp", RemoteAddress: "54.230.150.23", RemotePort: 443, BytesSent: 512000, BytesRecv: 2048000, Timestamp: time.Now()},
	}
}

