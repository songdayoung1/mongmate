package kr.co.mongmate.api.profile.dto.response;

import java.util.List;

public record DogListResponse(
        List<DogResponse> items
) {}
