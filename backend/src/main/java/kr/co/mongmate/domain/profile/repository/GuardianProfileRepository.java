package kr.co.mongmate.domain.profile.repository;

import kr.co.mongmate.domain.profile.entity.GuardianProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface GuardianProfileRepository extends JpaRepository<GuardianProfile, Long> {

    List<GuardianProfile> findAllByUserIdIn(Collection<Long> userIds);
}
