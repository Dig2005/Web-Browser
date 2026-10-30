package com.safora.backend.controller;

import com.safora.backend.model.BrowserSetting;
import com.safora.backend.service.SettingService;

import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
public class SettingController {

        private final SettingService settingService;

        public SettingController(SettingService settingService) {
                this.settingService = settingService;
        }

        @GetMapping
        public BrowserSetting getSettings(Authentication authentication) {
                return settingService.getSettings(authentication.getName());
        }

        @PutMapping
        public BrowserSetting updateSettings(Authentication authentication, @RequestBody BrowserSetting settings) {
                return settingService.updateSettings(authentication.getName(), settings);
        }
}