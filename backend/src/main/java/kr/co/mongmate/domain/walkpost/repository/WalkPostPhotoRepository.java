package kr.co.mongmate.domain.walkpost.repository;

import java.util.Collection;
import java.util.List;
import kr.co.mongmate.domain.walkpost.entity.WalkPostPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalkPostPhotoRepository extends JpaRepository<WalkPostPhoto, Long> {

    List<WalkPostPhoto> findAllByWalkPostIdInOrderByWalkPostIdAscSortOrderAsc(Collection<Long> postIds);

    List<WalkPostPhoto> findAllByWalkPostIdOrderBySortOrderAsc(Long postId);
}
