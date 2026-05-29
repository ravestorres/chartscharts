<!-- TestData.vue - Create this as a temporary test view -->
<template>
  <div>
    <b-container fluid>
      <b-card header="Store Data Test">
        <h4>Default User</h4>
        <pre>{{ JSON.stringify(defaultUser, null, 2) }}</pre>
        
        <h4 class="mt-4">Weekly Charts Structure</h4>
        <div v-if="weeklyCharts && weeklyCharts.length > 0">
          <p>Total weeks: {{ weeklyCharts.length }}</p>
          <b-button @click="showFirstWeek = !showFirstWeek">
            {{ showFirstWeek ? 'Hide' : 'Show' }} First Week Data
          </b-button>
          
          <div v-if="showFirstWeek">
            <h5>First Week Structure:</h5>
            <pre>{{ JSON.stringify(weeklyCharts[0], null, 2) }}</pre>
            
            <h5 class="mt-3">Artists in first week (first 10):</h5>
            <ul>
              <li v-for="artist in firstWeekArtists" :key="artist.name">
                {{ artist.name }} - #{{ artist.rank }} ({{ artist.playcount }} plays)
              </li>
            </ul>
            
            <h5 class="mt-3">Albums in first week (first 10):</h5>
            <ul>
              <li v-for="album in firstWeekAlbums" :key="album.name">
                {{ album.name }} by {{ album.artist }} - #{{ album.rank }}
              </li>
            </ul>
            
            <h5 class="mt-3">Tracks in first week (first 10):</h5>
            <ul>
              <li v-for="track in firstWeekTracks" :key="track.name">
                {{ track.name }} by {{ track.artist }} - #{{ track.rank }}
              </li>
            </ul>
          </div>
        </div>
        <div v-else>
          <p class="text-danger">No weekly charts found!</p>
        </div>
      </b-card>
    </b-container>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class TestData extends Vue {
  private showFirstWeek = false;

  get defaultUser() {
    return this.$store.getters.getDefaultUser;
  }

  get weeklyCharts() {
    if (!this.defaultUser) return [];
    try {
      return this.$store.getters.getUserChartList(this.defaultUser, 'weekly') || [];
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  }

  get firstWeekArtists() {
    if (!this.weeklyCharts[0] || !this.weeklyCharts[0].artists) return [];
    return this.weeklyCharts[0].artists.slice(0, 10);
  }

  get firstWeekAlbums() {
    if (!this.weeklyCharts[0] || !this.weeklyCharts[0].albums) return [];
    return this.weeklyCharts[0].albums.slice(0, 10);
  }

  get firstWeekTracks() {
    if (!this.weeklyCharts[0] || !this.weeklyCharts[0].tracks) return [];
    return this.weeklyCharts[0].tracks.slice(0, 10);
  }

  mounted() {
    console.log('Store getters:', Object.keys(this.$store.getters));
    console.log('Default user:', this.defaultUser);
    console.log('Weekly charts:', this.weeklyCharts);
  }
}
</script>