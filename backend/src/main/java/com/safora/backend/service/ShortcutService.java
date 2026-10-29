package com.safora.backend.service;

import com.safora.backend.model.Shortcut;
import com.safora.backend.model.User;

import com.safora.backend.repository.ShortcutRepository;
import com.safora.backend.repository.UserRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ShortcutService {

    private final ShortcutRepository
            shortcutRepository;

    private final UserRepository
            userRepository;

    public ShortcutService(
            ShortcutRepository shortcutRepository,
            UserRepository userRepository
    ) {

        this.shortcutRepository =
                shortcutRepository;

        this.userRepository =
                userRepository;
    }

    private User getUser(String email) {

        return userRepository
                .findByEmail(
                        email
                )
                .orElseThrow(
                        () ->
                                new RuntimeException(
                                        "User not found"
                                )
                );
    }

    public List<Shortcut> getShortcuts(String email) {

        User user =
                getUser(
                        email
                );

        return shortcutRepository
                .findByUserId(
                        user.getId()
                );
    }

    public Shortcut addShortcut(String email, Shortcut shortcut) {
        User user =
                getUser(
                        email
                );

        if (
                shortcut.getName() == null ||
                shortcut
                        .getName()
                        .trim()
                        .isEmpty()
        ) {

            throw new RuntimeException(
                    "Shortcut name is required"
            );
        }

        if (
                shortcut.getUrl() == null ||
                shortcut
                        .getUrl()
                        .trim()
                        .isEmpty()
        ) {

            throw new RuntimeException(
                    "Shortcut URL is required"
            );
        }

        shortcut.setId(
                null
        );

        shortcut.setUser(
                user
        );

        return shortcutRepository
                .save(
                        shortcut
                );
    }
public Shortcut updateShortcut(
        String email,
        Long shortcutId,
        Shortcut request
) {

    User user =
            getUser(
                    email
            );

    Shortcut shortcut =
            shortcutRepository
                    .findById(
                            shortcutId
                    )
                    .orElseThrow(
                            () ->
                                    new RuntimeException(
                                            "Shortcut not found"
                                    )
                    );

    if (
            !shortcut
                    .getUser()
                    .getId()
                    .equals(
                            user.getId()
                    )
    ) {

        throw new RuntimeException(
                "Shortcut not found"
        );
    }

    if (
            request.getName() == null ||
            request
                    .getName()
                    .trim()
                    .isEmpty()
    ) {

        throw new RuntimeException(
                "Shortcut name is required"
        );
    }

    if (
            request.getUrl() == null ||
            request
                    .getUrl()
                    .trim()
                    .isEmpty()
    ) {

        throw new RuntimeException(
                "Shortcut URL is required"
        );
    }

    shortcut.setName(
            request
                    .getName()
                    .trim()
    );

    shortcut.setUrl(
            request
                    .getUrl()
                    .trim()
    );

    return shortcutRepository
            .save(
                    shortcut
            );
}
    public void deleteShortcut(
            String email,
            Long shortcutId
    ) {

        User user =
                getUser(
                        email
                );

        Shortcut shortcut =
                shortcutRepository
                        .findById(
                                shortcutId
                        )
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "Shortcut not found"
                                        )
                        );

        if (
                !shortcut
                        .getUser()
                        .getId()
                        .equals(
                                user.getId()
                        )
        ) {

            throw new RuntimeException(
                    "Shortcut not found"
            );
        }

        shortcutRepository.delete(
                shortcut
        );
    }
}