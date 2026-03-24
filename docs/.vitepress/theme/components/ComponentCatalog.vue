<script setup lang="ts">
import {withBase} from 'vitepress'

import {componentCount, componentGroups} from '../../component-catalog.mjs'
</script>

<template>
  <div class="catalog-shell">
    <div class="uikit-stats catalog-stats">
      <cv-card class="catalog-stat-card" variant="outlined">
        <div slot="header" class="catalog-stat-header">
          <cv-badge variant="primary" pill size="small">Coverage</cv-badge>
        </div>
        <div class="catalog-stat-body">
          <span class="uikit-stat-value">{{ componentCount }}</span>
          <span class="uikit-stat-label">Spec-backed reference pages</span>
        </div>
      </cv-card>

      <cv-card class="catalog-stat-card" variant="outlined">
        <div slot="header" class="catalog-stat-header">
          <cv-badge variant="neutral" pill size="small">Source of truth</cv-badge>
        </div>
        <div class="catalog-stat-body">
          <span class="uikit-stat-value">Generated</span>
          <span class="uikit-stat-label">Synced from <code>specs/components</code></span>
        </div>
      </cv-card>

      <cv-card class="catalog-stat-card" variant="outlined">
        <div slot="header" class="catalog-stat-header">
          <cv-badge variant="success" pill size="small">Deployable</cv-badge>
        </div>
        <div class="catalog-stat-body">
          <span class="uikit-stat-value">GitHub Pages</span>
          <span class="uikit-stat-label">Static-safe paths and build output</span>
        </div>
      </cv-card>
    </div>

    <div class="component-grid catalog-grid">
      <cv-card
        v-for="group in componentGroups"
        :key="group.id"
        class="catalog-card"
        variant="outlined"
      >
        <div slot="header" class="catalog-card-header">
          <div class="catalog-card-heading">
            <cv-badge variant="neutral" pill size="small">Reference group</cv-badge>
            <h2 class="components-title">{{ group.title }}</h2>
          </div>
          <cv-badge variant="primary" pill size="small">{{ group.items.length }} items</cv-badge>
        </div>

        <div class="catalog-card-body">
          <p class="components-description">{{ group.description }}</p>
          <div class="component-links catalog-links">
            <a
              v-for="item in group.items"
              :key="item.slug"
              :href="withBase(`/components/${item.slug}`)"
              class="component-link catalog-link"
            >
              {{ item.name }}
            </a>
          </div>
        </div>
      </cv-card>
    </div>
  </div>
</template>
