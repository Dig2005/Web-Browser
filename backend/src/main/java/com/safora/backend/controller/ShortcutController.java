package com.safora.backend.controller;

import com.safora.backend.model.Shortcut;
import com.safora.backend.service.ShortcutService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import java.util.List;

@RestController
@RequestMapping("/api/shortcuts")
public class ShortcutController {

    private final ShortcutService shortcutService;

    public ShortcutController(ShortcutService shortcutService) {
        this.shortcutService =
                shortcutService;
    }

    @GetMapping
    public List<Shortcut> getShortcuts(Authentication authentication) {
        return shortcutService
                .getShortcuts(
                        authentication
                                .getName()
                );
    }

    @PostMapping
    public Shortcut addShortcut(Authentication authentication, @RequestBody Shortcut shortcut) {

        return shortcutService
                .addShortcut(
                        authentication
                                .getName(),

                        shortcut
                );
    }
@PutMapping("/{id}")
public Shortcut updateShortcut(
        Authentication authentication,

        @PathVariable
        Long id,

        @RequestBody
        Shortcut shortcut
) {

    return shortcutService
            .updateShortcut(
                    authentication
                            .getName(),

                    id,

                    shortcut
            );
}
    @DeleteMapping("/{id}")
    public void deleteShortcut(
            Authentication authentication,

            @PathVariable
            Long id
    ) {

        shortcutService
                .deleteShortcut(
                        authentication
                                .getName(),

                        id
                );
    }
}