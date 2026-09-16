package com.alight.marketplace.modules.category.repository;

import com.alight.marketplace.modules.category.entity.Brand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BrandRepository extends JpaRepository<Brand, UUID> {

    Optional<Brand> findBySlug(String slug);

    Optional<Brand> findBySlugAndActiveTrue(String slug);

    boolean existsByName(String name);

    boolean existsBySlug(String slug);

    List<Brand> findByActiveTrueOrderByNameAsc();

    @Query("SELECT b FROM Brand b WHERE (:search IS NULL OR LOWER(b.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<Brand> searchBrands(@Param("search") String search, Pageable pageable);
}
