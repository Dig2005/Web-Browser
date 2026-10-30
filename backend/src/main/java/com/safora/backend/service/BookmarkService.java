package com.safora.backend.service;

import com.safora.backend.model.Bookmark;
import com.safora.backend.model.User;

import com.safora.backend.repository.BookmarkRepository;
import com.safora.backend.repository.UserRepository;
import com.safora.backend.exception.BadRequestException;
import com.safora.backend.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookmarkService {
        private final BookmarkRepository bookmarkRepository;
        private final UserRepository userRepository;

        public BookmarkService(BookmarkRepository bookmarkRepository, UserRepository userRepository) {
                this.bookmarkRepository = bookmarkRepository;
                this.userRepository = userRepository;
        }

        private User getUser(String email) {
                return userRepository.findByEmail(email)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }

        public List<Bookmark> getBookmarks(String email) {
                User user = getUser(email);
                return bookmarkRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        }

        public Bookmark addBookmark(String email, Bookmark bookmark) {
                User user = getUser(email);
                if (bookmark.getUrl() == null || bookmark.getUrl().trim().isEmpty()) {
                        throw new BadRequestException("Bookmark URL is required");
                }
                String url = bookmark.getUrl().trim();
                bookmark.setUrl(url);
                if (bookmark.getTitle() == null || bookmark.getTitle().trim().isEmpty()) {
                        bookmark.setTitle(url);
                } else {
                        bookmark.setTitle(bookmark.getTitle().trim());
                }
                bookmark.setId(null);
                bookmark.setUser(user);
                return bookmarkRepository.save(bookmark);
        }

        public void deleteBookmark(String email, Long bookmarkId) {
                User user = getUser(email);
                Bookmark bookmark = bookmarkRepository.findById(bookmarkId)
                                .orElseThrow(() -> new ResourceNotFoundException("Bookmark not found"));
                if (!bookmark.getUser().getId().equals(user.getId())) {
                        throw new ResourceNotFoundException("Bookmark not found");
                }
                bookmarkRepository.delete(bookmark);
        }
}