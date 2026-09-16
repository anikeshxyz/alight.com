package com.alight.marketplace;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableTransactionManagement
public class AlightMarketplaceApplication {

    public static void main(String[] args) {
        freePortIfOccupied(8080);
        SpringApplication.run(AlightMarketplaceApplication.class, args);
    }

    private static void freePortIfOccupied(int port) {
        try {
            long currentPid = ProcessHandle.current().pid();
            String os = System.getProperty("os.name", "").toLowerCase();
            if (os.contains("win")) {
                Process p = new ProcessBuilder("cmd.exe", "/c", "netstat -ano | findstr :" + port).start();
                try (var reader = new java.io.BufferedReader(new java.io.InputStreamReader(p.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.contains("LISTENING")) {
                            String[] parts = line.split("\\s+");
                            if (parts.length >= 5) {
                                String pidStr = parts[parts.length - 1];
                                try {
                                    long pid = Long.parseLong(pidStr);
                                    if (pid > 0 && pid != currentPid) {
                                        System.out.println("[Alight Marketplace] Port " + port + " is occupied by PID " + pid + ". Releasing port...");
                                        ProcessHandle.of(pid).ifPresent(ProcessHandle::destroyForcibly);
                                        new ProcessBuilder("taskkill", "/F", "/PID", String.valueOf(pid)).start().waitFor();
                                    }
                                } catch (NumberFormatException ignored) {}
                            }
                        }
                    }
                }
                p.waitFor();
            } else {
                Process p = new ProcessBuilder("sh", "-c", "lsof -ti :" + port).start();
                try (var reader = new java.io.BufferedReader(new java.io.InputStreamReader(p.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (!line.isEmpty()) {
                            try {
                                long pid = Long.parseLong(line);
                                if (pid > 0 && pid != currentPid) {
                                    System.out.println("[Alight Marketplace] Port " + port + " is occupied by PID " + pid + ". Releasing port...");
                                    ProcessHandle.of(pid).ifPresent(ProcessHandle::destroyForcibly);
                                }
                            } catch (NumberFormatException ignored) {}
                        }
                    }
                }
                p.waitFor();
            }
            Thread.sleep(300);
        } catch (Exception e) {
            // Ignore and let Spring Boot startup proceed
        }
    }
}

