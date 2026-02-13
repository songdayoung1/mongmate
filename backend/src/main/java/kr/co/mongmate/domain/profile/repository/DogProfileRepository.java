package kr.co.mongmate.domain.profile.repository;

import java.util.List;
import kr.co.mongmate.domain.profile.entity.DogProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DogProfileRepository extends JpaRepository<DogProfile, Long> {

    List<DogProfile> findAllByGuardianUser_Id(Long guardianUserId);
}
