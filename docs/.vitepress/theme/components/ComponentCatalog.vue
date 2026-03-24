<script setup lang="ts">
import {withBase} from 'vitepress'

import {componentCount, componentGroups} from '../../component-catalog.mjs'
</script>

<template>
  <div class="catalog-shell">
    <div class="uikit-stats">
      <article class="uikit-stat">
        <span class="uikit-stat-value">{{ componentCount }}</span>
        <span class="uikit-stat-label">Spec-backed reference pages</span>
      </article>
      <article class="uikit-stat">
        <span class="uikit-stat-value">Generated</span>
        <span class="uikit-stat-label">Synced from <code>specs/components</code></span>
      </article>
      <article class="uikit-stat">
        <span class="uikit-stat-value">GitHub Pages</span>
        <span class="uikit-stat-label">Static-safe paths and build output</span>
      </article>
    </div>

    <div class="component-grid catalog-grid">
      <section v-for="group in componentGroups" :key="group.id" class="component-card catalog-card">
        <p class="components-kicker">{{ group.title }}</p>
        <h2 class="components-title">{{ group.title }}</h2>
        <p class="components-description">{{ group.description }}</p>
        <div class="component-links catalog-links">
          <a
            v-for="item in group.items"
            :key="item.slug"
            :href="withBase(`/components/${item.slug}`)"
            class="component-link"
          >
            {{ item.name }}
          </a>
        </div>
      </section>
    </div>
  </div>
</template>
