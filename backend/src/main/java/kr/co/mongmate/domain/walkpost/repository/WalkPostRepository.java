package kr.co.mongmate.domain.walkpost.repository;

import kr.co.mongmate.domain.walkpost.entity.WalkPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface WalkPostRepository extends JpaRepository<WalkPost, Long> {

    @Query("""
            select wp from WalkPost wp
            join fetch wp.author
            where wp.id = :postId
            """)
    Optional<WalkPost> findByIdWithAuthor(@Param("postId") Long postId);

    @Query(
            value = """
                    select wp from WalkPost wp
                    join fetch wp.author
                    where (:regionId is null or wp.regionId = :regionId)
                      and (:status is null or wp.status = :status)
                    """,
            countQuery = """
                    select count(wp) from WalkPost wp
                    where (:regionId is null or wp.regionId = :regionId)
                      and (:status is null or wp.status = :status)
                    """
    )
    Page<WalkPost> findAllWithAuthor(
            @Param("regionId") Long regionId,
            @Param("status") WalkPost.Status status,
            Pageable pageable
    );
}
