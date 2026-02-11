package kr.co.mongmate.api.walkpost.service;

import kr.co.mongmate.api.walkpost.dto.WalkPostCreateRequest;
import kr.co.mongmate.api.walkpost.dto.WalkPostCreateResponse;
import kr.co.mongmate.domain.user.entity.User;
import kr.co.mongmate.domain.user.repository.UserRepository;
import kr.co.mongmate.domain.walkpost.entity.WalkPost;
import kr.co.mongmate.domain.walkpost.repository.WalkPostRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class WalkPostCreateService {

    private static final int TITLE_MAX_LENGTH = 100;
    private static final int CONTENT_MAX_LENGTH = 5000;
    private static final int MEET_ADDRESS_MAX_LENGTH = 200;

    private static final double LAT_MIN = -90.0;
    private static final double LAT_MAX = 90.0;
    private static final double LNG_MIN = -180.0;
    private static final double LNG_MAX = 180.0;

    private static final boolean STORE_MEET_LOCATION = true; // TODO: set false if spatial (POINT) config is not ready

    private final WalkPostRepository walkPostRepository;
    private final UserRepository userRepository;

    @Transactional
    public WalkPostCreateResponse create(String userId, WalkPostCreateRequest request) {
        if (request == null) {
            throw badRequest("request body is required");
        }

        Long authorId = parseUserId(userId);

        validateTitle(request.title());
        validateContent(request.content());
        validateRegionId(request.regionId());
        validateDeadlineAt(request.deadlineAt());
        validateMeetAddress(request.meetAddress());
        validateMeetLatLng(request.meetLat(), request.meetLng());

        User author = userRepository.getReferenceById(authorId);

        Point meetLocation = resolveMeetLocation(request.meetLat(), request.meetLng());

        WalkPost saved = walkPostRepository.save(
                WalkPost.builder()
                        .author(author)
                        .title(request.title().trim())
                        .content(request.content())
                        .regionId(request.regionId())
                        .deadlineAt(request.deadlineAt())
                        .meetAddress(request.meetAddress())
                        .meetLocation(meetLocation)
                        .build()
        );

        return new WalkPostCreateResponse(saved.getId(), saved.getCreatedAt());
    }

    private void validateTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            throw badRequest("title is required");
        }
        int len = title.trim().length();
        if (len < 1 || len > TITLE_MAX_LENGTH) {
            throw badRequest("title length must be between 1 and " + TITLE_MAX_LENGTH);
        }
    }

    private void validateContent(String content) {
        if (content == null) return;
        if (content.length() > CONTENT_MAX_LENGTH) {
            throw badRequest("content length must be <= " + CONTENT_MAX_LENGTH);
        }
    }

    private void validateRegionId(Long regionId) {
        if (regionId == null || regionId < 1) {
            throw badRequest("regionId must be positive");
        }
    }

    private void validateDeadlineAt(LocalDateTime deadlineAt) {
        if (deadlineAt == null) return;
        if (deadlineAt.isBefore(LocalDateTime.now())) {
            throw badRequest("deadlineAt must be in the future");
        }
    }

    private void validateMeetAddress(String meetAddress) {
        if (meetAddress == null) return;
        if (meetAddress.length() > MEET_ADDRESS_MAX_LENGTH) {
            throw badRequest("meetAddress length must be <= " + MEET_ADDRESS_MAX_LENGTH);
        }
    }

    private void validateMeetLatLng(Double meetLat, Double meetLng) {
        boolean hasLat = meetLat != null;
        boolean hasLng = meetLng != null;

        if (hasLat != hasLng) {
            throw badRequest("meetLat and meetLng must be provided together");
        }
        if (!hasLat) return;

        if (meetLat < LAT_MIN || meetLat > LAT_MAX) {
            throw badRequest("meetLat out of range");
        }
        if (meetLng < LNG_MIN || meetLng > LNG_MAX) {
            throw badRequest("meetLng out of range");
        }
    }

    private Point resolveMeetLocation(Double meetLat, Double meetLng) {
        if (meetLat == null || meetLng == null) {
            return null;
        }
        if (!STORE_MEET_LOCATION) {
            return null;
        }
        GeometryFactory factory = new GeometryFactory();
        return factory.createPoint(new Coordinate(meetLng, meetLat));
    }

    private Long parseUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "unauthorized");
        }
        try {
            return Long.parseLong(userId);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "unauthorized");
        }
    }

    private ResponseStatusException badRequest(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, reason);
    }
}
