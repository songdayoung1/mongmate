package kr.co.mongmate.api.profile.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import kr.co.mongmate.api.profile.dto.request.DogCreateRequest;
import kr.co.mongmate.api.profile.dto.request.DogPatchRequest;
import kr.co.mongmate.api.profile.dto.request.DogUpdateRequest;
import kr.co.mongmate.domain.profile.entity.DogProfile;
import kr.co.mongmate.domain.profile.repository.DogProfileRepository;
import kr.co.mongmate.domain.user.entity.User;
import kr.co.mongmate.domain.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:mongmate;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.data.redis.host=localhost",
        "spring.data.redis.port=6379",
        "jwt.secret=test-jwt-secret"
})
class DogProfileControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    UserRepository userRepository;

    @Autowired
    DogProfileRepository dogProfileRepository;

    @AfterEach
    void tearDown() {
        dogProfileRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void create_should_return_201() throws Exception {
        User user = saveUser("01000000001");
        DogCreateRequest request = new DogCreateRequest(
                "Kongi",
                "Maltese",
                3,
                "MALE",
                true,
                "Vaccinated",
                "Active",
                "https://photo"
        );

        mockMvc.perform(post("/api/dogs")
                        .with(user(String.valueOf(user.getId())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dogId", notNullValue()))
                .andExpect(jsonPath("$.guardianUserId").value(user.getId()))
                .andExpect(jsonPath("$.name").value("Kongi"));
    }

    @Test
    void listMine_should_return_200() throws Exception {
        User user = saveUser("01000000002");
        saveDog(user, "Kongi");
        saveDog(user, "Dubu");

        mockMvc.perform(get("/api/dogs/me")
                        .with(user(String.valueOf(user.getId()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(2)));
    }

    @Test
    void getById_should_return_200() throws Exception {
        User user = saveUser("01000000003");
        DogProfile dog = saveDog(user, "Kongi");

        mockMvc.perform(get("/api/dogs/{dogId}", dog.getId())
                        .with(user(String.valueOf(user.getId()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dogId").value(dog.getId()));
    }

    @Test
    void update_should_return_200() throws Exception {
        User user = saveUser("01000000004");
        DogProfile dog = saveDog(user, "Kongi");

        DogUpdateRequest request = new DogUpdateRequest(
                "Kongi",
                "Maltese",
                4,
                "MALE",
                true,
                "More shots",
                "Calmer",
                "https://photo"
        );

        mockMvc.perform(put("/api/dogs/{dogId}", dog.getId())
                        .with(user(String.valueOf(user.getId())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dogId").value(dog.getId()))
                .andExpect(jsonPath("$.ageYears").value(4))
                .andExpect(jsonPath("$.updatedAt", notNullValue()));
    }

    @Test
    void patch_should_return_200() throws Exception {
        User user = saveUser("01000000005");
        DogProfile dog = saveDog(user, "Kongi");

        DogPatchRequest request = new DogPatchRequest(
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "https://new-photo"
        );

        mockMvc.perform(patch("/api/dogs/{dogId}", dog.getId())
                        .with(user(String.valueOf(user.getId())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dogId").value(dog.getId()))
                .andExpect(jsonPath("$.updatedAt", notNullValue()));
    }

    @Test
    void delete_should_return_200() throws Exception {
        User user = saveUser("01000000006");
        DogProfile dog = saveDog(user, "Kongi");

        mockMvc.perform(delete("/api/dogs/{dogId}", dog.getId())
                        .with(user(String.valueOf(user.getId()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dogId").value(dog.getId()))
                .andExpect(jsonPath("$.deleted").value(true))
                .andExpect(jsonPath("$.deletedAt", notNullValue()));
    }

    @Test
    void create_should_fail_when_name_blank() throws Exception {
        User user = saveUser("01000000007");
        DogCreateRequest request = new DogCreateRequest(
                "   ",
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        MvcResult result = mockMvc.perform(post("/api/dogs")
                        .with(user(String.valueOf(user.getId())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andReturn();

        ResponseStatusException ex = (ResponseStatusException) result.getResolvedException();
        assertThat(ex).isNotNull();
        assertThat(ex.getReason()).isEqualTo("INVALID_NAME");
    }

    @Test
    void getById_should_fail_when_not_found() throws Exception {
        User user = saveUser("01000000008");

        MvcResult result = mockMvc.perform(get("/api/dogs/{dogId}", 999L)
                        .with(user(String.valueOf(user.getId()))))
                .andExpect(status().isNotFound())
                .andReturn();

        ResponseStatusException ex = (ResponseStatusException) result.getResolvedException();
        assertThat(ex).isNotNull();
        assertThat(ex.getReason()).isEqualTo("DOG_NOT_FOUND");
    }

    @Test
    void update_should_fail_when_not_found() throws Exception {
        User user = saveUser("01000000009");
        DogUpdateRequest request = new DogUpdateRequest(
                "Kongi",
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        MvcResult result = mockMvc.perform(put("/api/dogs/{dogId}", 999L)
                        .with(user(String.valueOf(user.getId())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andReturn();

        ResponseStatusException ex = (ResponseStatusException) result.getResolvedException();
        assertThat(ex).isNotNull();
        assertThat(ex.getReason()).isEqualTo("DOG_NOT_FOUND");
    }

    @Test
    void delete_should_fail_when_not_found() throws Exception {
        User user = saveUser("01000000010");

        MvcResult result = mockMvc.perform(delete("/api/dogs/{dogId}", 999L)
                        .with(user(String.valueOf(user.getId()))))
                .andExpect(status().isNotFound())
                .andReturn();

        ResponseStatusException ex = (ResponseStatusException) result.getResolvedException();
        assertThat(ex).isNotNull();
        assertThat(ex.getReason()).isEqualTo("DOG_NOT_FOUND");
    }

    @Test
    void getById_should_fail_when_not_owner() throws Exception {
        User owner = saveUser("01000000011");
        User other = saveUser("01000000012");
        DogProfile dog = saveDog(owner, "Kongi");

        MvcResult result = mockMvc.perform(get("/api/dogs/{dogId}", dog.getId())
                        .with(user(String.valueOf(other.getId()))))
                .andExpect(status().isForbidden())
                .andReturn();

        ResponseStatusException ex = (ResponseStatusException) result.getResolvedException();
        assertThat(ex).isNotNull();
        assertThat(ex.getReason()).isEqualTo("NOT_OWNER");
    }

    @Test
    void update_should_fail_when_not_owner() throws Exception {
        User owner = saveUser("01000000013");
        User other = saveUser("01000000014");
        DogProfile dog = saveDog(owner, "Kongi");

        DogUpdateRequest request = new DogUpdateRequest(
                "Kongi",
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        MvcResult result = mockMvc.perform(put("/api/dogs/{dogId}", dog.getId())
                        .with(user(String.valueOf(other.getId()))))
                .andExpect(status().isForbidden())
                .andReturn();

        ResponseStatusException ex = (ResponseStatusException) result.getResolvedException();
        assertThat(ex).isNotNull();
        assertThat(ex.getReason()).isEqualTo("NOT_OWNER");
    }

    @Test
    void delete_should_fail_when_not_owner() throws Exception {
        User owner = saveUser("01000000015");
        User other = saveUser("01000000016");
        DogProfile dog = saveDog(owner, "Kongi");

        MvcResult result = mockMvc.perform(delete("/api/dogs/{dogId}", dog.getId())
                        .with(user(String.valueOf(other.getId()))))
                .andExpect(status().isForbidden())
                .andReturn();

        ResponseStatusException ex = (ResponseStatusException) result.getResolvedException();
        assertThat(ex).isNotNull();
        assertThat(ex.getReason()).isEqualTo("NOT_OWNER");
    }

    private User saveUser(String phoneNumber) {
        User user = User.builder()
                .phoneNumber(phoneNumber)
                .termsAgreedAt(LocalDateTime.now())
                .build();
        return userRepository.save(user);
    }

    private DogProfile saveDog(User guardian, String name) {
        DogProfile dog = DogProfile.builder()
                .guardianUser(guardian)
                .name(name)
                .build();
        return dogProfileRepository.save(dog);
    }
}
