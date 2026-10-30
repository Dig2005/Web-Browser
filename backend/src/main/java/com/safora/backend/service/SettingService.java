package com.safora.backend.service;

import com.safora.backend.model.BrowserSetting;
import com.safora.backend.model.User;
import com.safora.backend.repository.BrowserSettingRepository;
import com.safora.backend.repository.UserRepository;
import com.safora.backend.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class SettingService {
        private final BrowserSettingRepository settingRepository;
        private final UserRepository userRepository;

        public SettingService(BrowserSettingRepository settingRepository, UserRepository userRepository) {
                this.settingRepository = settingRepository;
                this.userRepository = userRepository;
        }

        private User getUser(String email) {
                return userRepository.findByEmail(email)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }

        public BrowserSetting getSettings(String email) {
                User user = getUser(email);
                return settingRepository.findByUserId(user.getId()).orElseGet(() -> {
                        BrowserSetting settings = new BrowserSetting();
                        settings.setUser(user);
                        settings.setSearchEngine("bing");
                        settings.setTheme("dark");
                        settings.setStartupMode("home");
                        settings.setStartupUrl("");
                        settings.setAskDownloadLocation(false);
                        settings.setSwitchToNewTab(true);
                        return settingRepository.save(settings);
                });
        }

        public BrowserSetting updateSettings(String email, BrowserSetting request) {
                BrowserSetting settings = getSettings(email);
                if (request.getSearchEngine() != null) {
                        settings.setSearchEngine(request.getSearchEngine());
                }
                if (request.getTheme() != null) {
                        settings.setTheme(request.getTheme());
                }
                if (request.getStartupMode() != null) {
                        settings.setStartupMode(request.getStartupMode());
                }
                if (request.getStartupUrl() != null) {
                        settings.setStartupUrl(request.getStartupUrl());
                }
                if (request.getAskDownloadLocation() != null) {
                        settings.setAskDownloadLocation(request.getAskDownloadLocation());
                }
                if (request.getSwitchToNewTab() != null) {
                        settings.setSwitchToNewTab(request.getSwitchToNewTab());
                }
                return settingRepository.save(settings);
        }
}