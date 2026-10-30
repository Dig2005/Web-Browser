package com.safora.backend.controller;

import com.safora.backend.model.Bookmark;
import com.safora.backend.service.BookmarkService;

import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/bookmarks")
public class BookmarkController {

        private final BookmarkService bookmarkService;

        public BookmarkController(BookmarkService bookmarkService) {
                this.bookmarkService = bookmarkService;
        }

        @GetMapping
        public List<Bookmark> getBookmarks(Authentication authentication) {
                return bookmarkService.getBookmarks(authentication.getName());
        }

        @PostMapping
        public Bookmark addBookmark(Authentication authentication, @RequestBody Bookmark bookmark) {
                return bookmarkService
                                .addBookmark(authentication.getName(), bookmark);
        }

        @DeleteMapping("/{id}")
        public void deleteBookmark(Authentication authentication, @PathVariable Long id) {
                bookmarkService.deleteBookmark(authentication.getName(), id);
        }
}