package com.alight.marketplace.modules.category.repository;

import com.alight.marketplace.modules.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Optional<Category> findBySlug(String slug);

    Optional<Category> findBySlugAndActiveTrue(String slug);

    boolean existsByName(String name);

    boolean existsBySlug(String slug);

    @Query("SELECT c FROM Category c WHERE c.parent IS NULL AND c.active = true ORDER BY c.displayOrder ASC, c.name ASC")
    List<Category> findRootCategoriesActive();

    @Query("SELECT c FROM Category c WHERE c.parent IS NULL ORDER BY c.displayOrder ASC, c.name ASC")
    List<Category> findRootCategoriesAll();

    List<Category> findByParentIdAndActiveTrueOrderByDisplayOrderAscNameAsc(UUID parentId);

    List<Category> findByParentIdOrderByDisplayOrderAscNameAsc(UUID parentId);
}
