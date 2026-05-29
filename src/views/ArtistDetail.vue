<template>
  <div>
    <b-container centered class="py-4">
      <b-row v-if="artistInfo">
        <b-col class="px-0 px-sm-3">
          <!-- Artist Header -->
          <b-card class="mb-4 mt-3 shadow border-0"
                  :bg-variant="theme === 'light' ? 'white' : 'dark'"
                  :text-variant="theme === 'light' ? 'dark' : 'white'">
            <b-row centered>
                <b-col md="8" class="text-center mx-auto">
                 <h1 class="display-4 mb-2 text-center">
      {{ artistInfo.name }}
    </h1>
                
                <!-- Quick Stats - Centered -->
                <b-row class="mt-4 justify-content-center">
                  <b-col md="3" sm="6" class="mb-2">
                    <div class="stat-card-mini text-center" :class="'bg-' + theme">
                      <div class="stat-value-mini">{{ artistInfo.totalWeeksOnChart || 0 }}</div>
                      <div class="stat-label-mini">{{ $t('Total weeks on chart') }}</div>
                    </div>
                  </b-col>
                  <b-col md="3" sm="6" class="mb-2">
                    <div class="stat-card-mini text-center" :class="'bg-' + theme">
                      <div class="stat-value-mini">#{{ artistInfo.peakPosition || '-' }}</div>
                      <div class="stat-label-mini">{{ $t('Peak Position') }}</div>
                    </div>
                  </b-col>
                  <b-col md="3" sm="6" class="mb-2">
                    <div class="stat-card-mini text-center" :class="'bg-' + theme">
                      <div class="stat-value-mini">{{ artistInfo.numberOneHits || 0 }}</div>
                      <div class="stat-label-mini">{{ $t('Number One Hits') }}</div>
                    </div>
                  </b-col>
                  <b-col md="3" sm="6" class="mb-2">
                    <div class="stat-card-mini text-center" :class="'bg-' + theme">
                      <div class="stat-value-mini">{{ artistInfo.topTenHits || 0 }}</div>
                      <div class="stat-label-mini">{{ $t('Top Ten Hits') }}</div>
                    </div>
                  </b-col>
                </b-row>
              </b-col>
              <b-col md="4" class="text-center">
                <div class="artist-avatar mb-3">
                  <font-awesome-icon :icon="['fas', 'user-circle']" size="8x" />
                </div>
                <b-button-group>
                  <b-button variant="danger" @click="viewChartHistory" :title="$t('chart.full_history')">
                    <font-awesome-icon :icon="['fas', 'chart-line']" />
                  </b-button>
                </b-button-group>
              </b-col>
              
            </b-row>
            
          </b-card>

          <!-- Tabs for Albums and Tracks -->
          <b-card class="mb-4 shadow border-0"
                  :bg-variant="theme === 'light' ? 'white' : 'dark'"
                  :text-variant="theme === 'light' ? 'dark' : 'white'">
            <!-- Sorting Controls -->
            <div class="d-flex justify-content-between align-items-center mb-3">
              <b-button-group size="sm">
                <b-button :variant="albumSortBy === 'weeks_on_chart' ? 'danger' : 'outline-danger'" 
                          @click="setAlbumSort('weeks_on_chart')">
                  {{ $t('Sort by Weeks') }}
                </b-button>
                <b-button :variant="albumSortBy === 'name' ? 'danger' : 'outline-danger'" 
                          @click="setAlbumSort('name')">
                  {{ $t('Sort by Name') }}
                </b-button>
                <b-button :variant="albumSortBy === 'debut_date' ? 'danger' : 'outline-danger'" 
                          @click="setAlbumSort('debut_date')">
                  {{ $t('Sort by Debut') }}
                </b-button>
              </b-button-group>
              <b-button size="sm" variant="outline-secondary" @click="toggleAlbumSortOrder">
                <font-awesome-icon :icon="albumSortDesc ? ['fas', 'arrow-down'] : ['fas', 'arrow-up']" />
              </b-button>
            </div>
            
            <!-- Tabs -->
            <b-tabs card justified>
              <!-- Albums Tab -->
              <b-tab :title="$tc('word.album', 2)" active>
                <b-table
                  v-if="artistInfo.albums.length > 0"
                  :fields="albumFields"
                  :items="sortedAlbums"
                  responsive="lg"
                  :dark="theme === 'dark'"
                  :striped="true"
                  :hover="true"
                  :small="true">
                  <template #cell(name)="row">
                    <span class="font-weight-semibold">{{ row.item.name }}</span>
                  </template>
                  <template #cell(peak_position)="row">
                    <div class="text-center">
                      <span v-if="row.item.peak_position === 1" class="gold-star-text">#1 ⭐</span>
                      <span v-else-if="row.item.peak_position <= 10" class="text-info">#{{ row.item.peak_position }}</span>
                      <span v-else>#{{ row.item.peak_position }}</span>
                      <span class="small text-muted d-block">({{ row.item.peak_count }}x)</span>
                    </div>
                  </template>
                  <template #cell(weeks)="row">
                    <span class="font-weight-bold">{{ row.item.weeks_on_chart }}</span>
                    <span class="small text-muted d-block">{{ $tc('weeks', row.item.weeks_on_chart) }}</span>
                  </template>
                  <template #cell(debut_date)="row">
                    <div class="text-center">
                      <span class="small">{{ formatDateShort(row.item.debut_date) }}</span>
                    </div>
                  </template>
                  <template #cell(actions)="row">
                    <b-button size="sm" variant="outline-info" @click="viewAlbumHistory(row.item)" :title="$t('chart.history')">
                      <font-awesome-icon :icon="['fas', 'chart-line']" />
                    </b-button>
                  </template>
                </b-table>
                <div v-else class="text-center py-4 text-muted">
                  {{ $t('messages.no_albums_found') }}
                </div>
              </b-tab>

              <!-- Tracks Tab -->
              <b-tab :title="$tc('word.track', 2)">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <b-button-group size="sm">
                    <b-button :variant="trackSortBy === 'weeks_on_chart' ? 'danger' : 'outline-danger'" 
                              @click="setTrackSort('weeks_on_chart')">
                      {{ $t('Sort by Weeks') }}
                    </b-button>
                    <b-button :variant="trackSortBy === 'name' ? 'danger' : 'outline-danger'" 
                              @click="setTrackSort('name')">
                      {{ $t('Sort by Name') }}
                    </b-button>
                    <b-button :variant="trackSortBy === 'debut_date' ? 'danger' : 'outline-danger'" 
                              @click="setTrackSort('debut_date')">
                      {{ $t('Sort by Debut') }}
                    </b-button>
                  </b-button-group>
                  <b-button size="sm" variant="outline-secondary" @click="toggleTrackSortOrder">
                    <font-awesome-icon :icon="trackSortDesc ? ['fas', 'arrow-down'] : ['fas', 'arrow-up']" />
                  </b-button>
                </div>
                <b-table
                  v-if="artistInfo.tracks.length > 0"
                  :fields="trackFields"
                  :items="sortedTracks"
                  responsive="lg"
                  :dark="theme === 'dark'"
                  :striped="true"
                  :hover="true"
                  :small="true">
                  <template #cell(name)="row">
                    <span class="font-weight-semibold">{{ row.item.name }}</span>
                  </template>
                  <template #cell(peak_position)="row">
                    <div class="text-center">
                      <span v-if="row.item.peak_position === 1" class="gold-star-text">#1 ⭐</span>
                      <span v-else-if="row.item.peak_position <= 10" class="text-info">#{{ row.item.peak_position }}</span>
                      <span v-else>#{{ row.item.peak_position }}</span>
                      <span class="small text-muted d-block">({{ row.item.peak_count }}x)</span>
                    </div>
                  </template>
                  <template #cell(weeks)="row">
                    <span class="font-weight-bold">{{ row.item.weeks_on_chart }}</span>
                    <span class="small text-muted d-block">{{ $tc('weeks', row.item.weeks_on_chart) }}</span>
                  </template>
                  <template #cell(debut_date)="row">
                    <div class="text-center">
                      <span class="small">{{ formatDateShort(row.item.debut_date) }}</span>
                    </div>
                  </template>
                  <template #cell(actions)="row">
                    <b-button size="sm" variant="outline-info" @click="viewTrackHistory(row.item)" :title="$t('chart.history')">
                      <font-awesome-icon :icon="['fas', 'chart-line']" />
                    </b-button>
                  </template>
                </b-table>
                <div v-else class="text-center py-4 text-muted">
                  {{ $t('messages.no_tracks_found') }}
                </div>
              </b-tab>
            </b-tabs>
          </b-card>
        </b-col>
      </b-row>
      <b-row v-else-if="loading">
        <b-col>
          <b-card class="mb-4 mt-3 shadow border-0"
                  :bg-variant="theme === 'light' ? 'white' : 'dark'"
                  :text-variant="theme === 'light' ? 'dark' : 'white'">
            <b-card-body class="text-center py-5">
              <b-spinner variant="danger" class="mb-3"></b-spinner>
              <h5>{{ $t('messages.loading_artist_data') }}</h5>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
      <b-row v-else>
        <b-col>
          <b-card class="mb-4 mt-3 shadow border-0"
                  :bg-variant="theme === 'light' ? 'white' : 'dark'"
                  :text-variant="theme === 'light' ? 'dark' : 'white'">
            <b-card-body class="text-center py-5">
              <font-awesome-icon :icon="['fas', 'user-slash']" size="4x" class="mb-3 text-muted" />
              <h4>{{ $t('messages.artist_not_found') }}</h4>
              <p class="text-muted">{{ $t('messages.artist_not_found_desc') }}</p>
              <b-button variant="danger" @click="$router.back()">
                {{ $t('word.go_back') }}
              </b-button>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
    </b-container>

    <!-- Rest of modals remain the same -->
    <!-- Artist Chart History Modal -->
    <b-modal v-model="showChartModal" size="xl" :title="modalTitle" hide-footer scrollable
             :header-bg-variant="theme === 'light' ? 'light' : 'dark'"
             :header-text-variant="theme === 'light' ? 'dark' : 'white'"
             :body-bg-variant="theme === 'light' ? 'white' : 'dark'"
             :body-text-variant="theme === 'light' ? 'dark' : 'white'">
      <div v-if="selectedItem">
        <div class="summary-stats mb-4" v-if="selectedItem.chartPositions && selectedItem.chartPositions.length > 0">
          <b-row class="justify-content-center">
            <b-col md="3" sm="6" class="mb-2">
              <div class="stat-card text-center" :class="'bg-' + theme">
                <div class="stat-value">{{ selectedItem.chartPositions.length }}</div>
                <div class="stat-label">{{ $t('Total Weeks on Chart') }}</div>
              </div>
            </b-col>
            <b-col md="3" sm="6" class="mb-2">
              <div class="stat-card text-center" :class="'bg-' + theme">
                <div class="stat-value">
                  #{{ getPeakPosition() }}
                  <small class="stat-sub">({{ getPeakWeeksCount() }}x)</small>
                </div>
                <div class="stat-label">{{ $t('Peak Position') }}</div>
              </div>
            </b-col>
            <b-col md="3" sm="6" class="mb-2">
              <div class="stat-card text-center" :class="'bg-' + theme">
                <div class="stat-value">{{ chartRuns.length }}</div>
                <div class="stat-label">{{ $t('Chart Runs') }}</div>
              </div>
            </b-col>
          </b-row>
        </div>
        
        <div class="chart-runs-grid mb-4" v-if="chartRuns.length > 0">
          <div class="chart-runs-header">
            <h6 class="text-center">{{ $t('chart.chart_runs_analysis') }}</h6>
            <small class="text-muted text-center d-block">{{ selectedItem.name }}</small>
          </div>
          <div class="chart-runs-container">
            <div v-for="(run, runIndex) in chartRuns" :key="runIndex" class="chart-run-section"
                 :style="{ backgroundColor: theme === 'dark' ? '#2d2d2d' : 'white' }">
              <div class="run-header">
                <strong>{{ $t('Run') }} {{ runIndex + 1 }}</strong>
                <small class="text-muted ml-2">
                  {{ run.length }} {{ $tc('Weeks', run.length) }} | 
                  {{ formatDateFull(run[0].date) }} - {{ formatDateFull(run[run.length - 1].date) }}
                </small>
                <b-badge variant="info" class="ml-2">
                  {{ $t('chart.peak') }}: #{{ getRunPeakPosition(run) }} ({{ getRunPeakWeeks(run) }}x)
                </b-badge>
              </div>
              <div class="run-grid">
                <div v-for="(entry, entryIndex) in run" :key="entryIndex" 
                     class="chart-entry"
                     :class="{
                       'peak-number-one': entry.position === 1,
                       'drastic-drop': getPositionChange(entry, entryIndex, run) <= -5
                     }">
                  <div class="position" :class="getPositionClass(entry.position, run, entryIndex)">
                    #{{ entry.position }}
                    <span v-if="entry.position === 1" class="peak-star gold-star">★</span>
                    <span v-if="getPositionChange(entry, entryIndex, run) <= -5" class="drop-indicator">▼</span>
                  </div>
                  <div class="date">{{ formatDateGrid(entry.date) }}</div>
                  <div class="plays">{{ entry.playcount }} {{ $t('plays') }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <b-table 
          v-if="selectedItem.chartPositions && selectedItem.chartPositions.length > 0"
          :items="selectedItem.chartPositions"
          :fields="chartRunFields"
          responsive="lg"
          :small="true"
          :bordered="true"
          :hover="true"
          :dark="theme === 'dark'"
          :sort-by.sync="historySortBy"
          :sort-desc.sync="historySortDesc"
          class="mt-4">
          <template #cell(date)="row">
            {{ formatDateFull(row.item.date) }}
          </template>
          <template #cell(position)="row">
            <b-badge v-if="row.item.position === 1" variant="warning" pill class="gold-badge">⭐ #1</b-badge>
            <b-badge v-else-if="row.item.position <= 10" variant="info" pill>#{{ row.item.position }}</b-badge>
            <b-badge v-else variant="secondary" pill>#{{ row.item.position }}</b-badge>
          </template>
          <template #cell(position_change)="row">
            <div v-if="row.index > 0" class="text-center">
              <span v-if="row.item.position_change < -4" class="text-danger font-weight-bold">
                ▼ {{ Math.abs(row.item.position_change) }}
              </span>
              <span v-else-if="row.item.position_change > 4" class="text-success font-weight-bold">
                ▲ {{ row.item.position_change }}
              </span>
              <span v-else-if="row.item.position_change < 0" class="text-danger">
                ▼ {{ Math.abs(row.item.position_change) }}
              </span>
              <span v-else-if="row.item.position_change > 0" class="text-success">
                ▲ {{ row.item.position_change }}
              </span>
              <span v-else class="text-muted">-</span>
            </div>
            <div v-else class="text-center text-muted">-</div>
          </template>
          <template #cell(playcount)="row">
            {{ formatNumber(row.item.playcount) }}
          </template>
          <template #cell(actions)="row">
            <b-button size="sm" variant="outline-info" @click="scrollToPosition(row.item.date)" :title="$t('word.view')">
              <font-awesome-icon :icon="['fas', 'search']" />
            </b-button>
          </template>
        </b-table>
      </div>
    </b-modal>

    <!-- Album Chart History Modal -->
    <b-modal v-model="showAlbumModal" size="xl" :title="albumModalTitle" hide-footer scrollable
             :header-bg-variant="theme === 'light' ? 'light' : 'dark'"
             :header-text-variant="theme === 'light' ? 'dark' : 'white'"
             :body-bg-variant="theme === 'light' ? 'white' : 'dark'"
             :body-text-variant="theme === 'light' ? 'dark' : 'white'">
      <div v-if="selectedAlbum">
        <div class="summary-stats mb-4" v-if="selectedAlbum.chartPositions && selectedAlbum.chartPositions.length > 0">
          <b-row class="justify-content-center">
            <b-col md="3" sm="6" class="mb-2">
              <div class="stat-card text-center" :class="'bg-' + theme">
                <div class="stat-value">{{ selectedAlbum.chartPositions.length }}</div>
                <div class="stat-label">{{ $t('Total Weeks on Chart') }}</div>
              </div>
            </b-col>
            <b-col md="3" sm="6" class="mb-2">
              <div class="stat-card text-center" :class="'bg-' + theme">
                <div class="stat-value">
                  #{{ getAlbumPeakPosition() }}
                  <small class="stat-sub">({{ getAlbumPeakWeeksCount() }}x)</small>
                </div>
                <div class="stat-label">{{ $t('Peak Position') }}</div>
              </div>
            </b-col>
            <b-col md="3" sm="6" class="mb-2">
              <div class="stat-card text-center" :class="'bg-' + theme">
                <div class="stat-value">{{ albumChartRuns.length }}</div>
                <div class="stat-label">{{ $t('Chart Runs') }}</div>
              </div>
            </b-col>
          </b-row>
        </div>
        
        <div class="chart-runs-grid mb-4" v-if="albumChartRuns.length > 0">
          <div class="chart-runs-header">
            <h6 class="text-center">{{ $t('chart.chart_runs_analysis') }}</h6>
            <small class="text-muted text-center d-block">{{ selectedAlbum.name }}</small>
          </div>
          <div class="chart-runs-container">
            <div v-for="(run, runIndex) in albumChartRuns" :key="runIndex" class="chart-run-section"
                 :style="{ backgroundColor: theme === 'dark' ? '#2d2d2d' : 'white' }">
              <div class="run-header">
                <strong>{{ $t('Run') }} {{ runIndex + 1 }}</strong>
                <small class="text-muted ml-2">
                  {{ run.length }} {{ $tc('Weeks', run.length) }} | 
                  {{ formatDateFull(run[0].date) }} - {{ formatDateFull(run[run.length - 1].date) }}
                </small>
                <b-badge variant="info" class="ml-2">
                  {{ $t('chart.peak') }}: #{{ getRunPeakPosition(run) }} ({{ getRunPeakWeeks(run) }}x)
                </b-badge>
              </div>
              <div class="run-grid">
                <div v-for="(entry, entryIndex) in run" :key="entryIndex" 
                     class="chart-entry"
                     :class="{
                       'peak-number-one': entry.position === 1,
                       'drastic-drop': getPositionChange(entry, entryIndex, run) <= -5
                     }">
                  <div class="position" :class="getPositionClass(entry.position, run, entryIndex)">
                    #{{ entry.position }}
                    <span v-if="entry.position === 1" class="peak-star gold-star">★</span>
                    <span v-if="getPositionChange(entry, entryIndex, run) <= -5" class="drop-indicator">▼</span>
                  </div>
                  <div class="date">{{ formatDateGrid(entry.date) }}</div>
                  <div class="plays">{{ entry.playcount }} {{ $t('plays') }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </b-modal>

    <!-- Track Chart History Modal -->
    <b-modal v-model="showTrackModal" size="xl" :title="trackModalTitle" hide-footer scrollable
             :header-bg-variant="theme === 'light' ? 'light' : 'dark'"
             :header-text-variant="theme === 'light' ? 'dark' : 'white'"
             :body-bg-variant="theme === 'light' ? 'white' : 'dark'"
             :body-text-variant="theme === 'light' ? 'dark' : 'white'">
      <div v-if="selectedTrack">
        <div class="summary-stats mb-4" v-if="selectedTrack.chartPositions && selectedTrack.chartPositions.length > 0">
          <b-row class="justify-content-center">
            <b-col md="3" sm="6" class="mb-2">
              <div class="stat-card text-center" :class="'bg-' + theme">
                <div class="stat-value">{{ selectedTrack.chartPositions.length }}</div>
                <div class="stat-label">{{ $t('Total Weeks on Chart') }}</div>
              </div>
            </b-col>
            <b-col md="3" sm="6" class="mb-2">
              <div class="stat-card text-center" :class="'bg-' + theme">
                <div class="stat-value">
                  #{{ getTrackPeakPosition() }}
                  <small class="stat-sub">({{ getTrackPeakWeeksCount() }}x)</small>
                </div>
                <div class="stat-label">{{ $t('Peak Position') }}</div>
              </div>
            </b-col>
            <b-col md="3" sm="6" class="mb-2">
              <div class="stat-card text-center" :class="'bg-' + theme">
                <div class="stat-value">{{ trackChartRuns.length }}</div>
                <div class="stat-label">{{ $t('Chart Runs') }}</div>
              </div>
            </b-col>
          </b-row>
        </div>
        
        <div class="chart-runs-grid mb-4" v-if="trackChartRuns.length > 0">
          <div class="chart-runs-header">
            <h6 class="text-center">{{ $t('chart.chart_runs_analysis') }}</h6>
            <small class="text-muted text-center d-block">{{ selectedTrack.name }}</small>
          </div>
          <div class="chart-runs-container">
            <div v-for="(run, runIndex) in trackChartRuns" :key="runIndex" class="chart-run-section"
                 :style="{ backgroundColor: theme === 'dark' ? '#2d2d2d' : 'white' }">
              <div class="run-header">
                <strong>{{ $t('chart.run') }} {{ runIndex + 1 }}</strong>
                <small class="text-muted ml-2">
                  {{ run.length }} {{ $tc('Weeks', run.length) }} | 
                  {{ formatDateFull(run[0].date) }} - {{ formatDateFull(run[run.length - 1].date) }}
                </small>
                <b-badge variant="info" class="ml-2">
                  {{ $t('chart.peak') }}: #{{ getRunPeakPosition(run) }} ({{ getRunPeakWeeks(run) }}x)
                </b-badge>
              </div>
              <div class="run-grid">
                <div v-for="(entry, entryIndex) in run" :key="entryIndex" 
                     class="chart-entry"
                     :class="{
                       'peak-number-one': entry.position === 1,
                       'drastic-drop': getPositionChange(entry, entryIndex, run) <= -5
                     }">
                  <div class="position" :class="getPositionClass(entry.position, run, entryIndex)">
                    #{{ entry.position }}
                    <span v-if="entry.position === 1" class="peak-star gold-star">★</span>
                    <span v-if="getPositionChange(entry, entryIndex, run) <= -5" class="drop-indicator">▼</span>
                  </div>
                  <div class="date">{{ formatDateGrid(entry.date) }}</div>
                  <div class="plays">{{ entry.playcount }} {{ $t('plays') }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </b-modal>
  </div>
</template>

<script lang="ts">
import moment from 'moment';
import { Vue } from 'vue-property-decorator';
import { getUserChartList } from "@/charts/helpers";

interface ChartPosition {
  date: string;
  position: number;
  playcount: number;
  position_change?: number;
}

interface ArtistInfo {
  name: string;
  bio?: string;
  isTopArtist: boolean;
  totalWeeksOnChart: number;
  peakPosition: number;
  peakCount: number;
  numberOneHits: number;
  topTenHits: number;
  albums: any[];
  tracks: any[];
  chartHistory: ChartPosition[];
}

export default Vue.extend({
  name: 'ArtistDetail',
  data() {
    return {
      artistInfo: null as ArtistInfo | null,
      loading: true,
      showChartModal: false,
      selectedItem: null as any,
      chartRuns: [] as any[],
      
      // Album modal
      showAlbumModal: false,
      selectedAlbum: null as any,
      albumChartRuns: [] as any[],
      
      // Track modal
      showTrackModal: false,
      selectedTrack: null as any,
      trackChartRuns: [] as any[],
      
      // Sort variables
      albumSortBy: 'peak_position',
      albumSortDesc: false,
      trackSortBy: 'peak_position',
      trackSortDesc: false,
      historySortBy: 'date',
      historySortDesc: false,
      albumHistorySortBy: 'date',
      albumHistorySortDesc: false,
      trackHistorySortBy: 'date',
      trackHistorySortDesc: false,
      
      chartRunFields: [
        { key: 'date', label: this.$t('word.week_ending'), sortable: true },
        { key: 'position', label: this.$t('word.position'), sortable: true, class: 'text-center' },
        { key: 'position_change', label: this.$t('chart.change'), sortable: true, class: 'text-center' },
        { key: 'playcount', label: this.$t('plays'), sortable: true, class: 'text-center' },
        { key: 'actions', label: this.$t('Action'), sortable: false, class: 'text-center' }
      ],
      albumHistoryFields: [
        { key: 'date', label: this.$t('word.week_ending'), sortable: true },
        { key: 'position', label: this.$t('word.position'), sortable: true, class: 'text-center' },
        { key: 'position_change', label: this.$t('chart.change'), sortable: true, class: 'text-center' },
        { key: 'playcount', label: this.$t('plays'), sortable: true, class: 'text-center' }
      ],
      trackHistoryFields: [
        { key: 'date', label: this.$t('Ending'), sortable: true },
        { key: 'position', label: this.$t('Position'), sortable: true, class: 'text-center' },
        { key: 'position_change', label: this.$t('Change'), sortable: true, class: 'text-center' },
        { key: 'playcount', label: this.$t('Plays'), sortable: true, class: 'text-center' }
      ],
      albumFields: [
        { key: 'name', label: this.$tc('word.album', 1), class: 'title', sortable: true },
        { key: 'peak_position', label: this.$t('Peak Position'), class: 'text-center', sortable: true },
        { key: 'weeks', label: this.$t('Weeks On Chart'), class: 'text-center', sortable: true },
        { key: 'debut_date', label: this.$t('Debut Date'), class: 'text-center', sortable: true },
        { key: 'actions', label: this.$t('Action'), class: 'text-center', sortable: false }
      ],
      trackFields: [
        { key: 'name', label: this.$tc('word.track', 1), class: 'title', sortable: true },
        { key: 'peak_position', label: this.$t('Peak Position'), class: 'text-center', sortable: true },
        { key: 'weeks', label: this.$t('Weeks On Chart'), class: 'text-center', sortable: true },
        { key: 'debut_date', label: this.$t('Debut Date'), class: 'text-center', sortable: true },
        { key: 'actions', label: this.$t('Action'), class: 'text-center', sortable: false }
      ]
    };
  },
  computed: {
    user: {
      get(): any {
        return this.$store.getters.getDefaultUser;
      }
    },
    theme(): string {
      return this.$store.getters.getTheme;
    },
    modalTitle(): string {
      if (!this.selectedItem) return this.$t('chart.chart_history') as string;
      return `${this.selectedItem.name}`;
    },
    albumModalTitle(): string {
      if (!this.selectedAlbum) return this.$t('chart.chart_history') as string;
      return ` ${this.selectedAlbum.name}`;
    },
    trackModalTitle(): string {
      if (!this.selectedTrack) return this.$t('chart.chart_history') as string;
      return ` ${this.selectedTrack.name}`;
    },
    sortedAlbums(): any[] {
      if (!this.artistInfo) return [];
      const albums = [...this.artistInfo.albums];
      
      if (this.albumSortBy === 'weeks_on_chart') {
        albums.sort((a, b) => this.albumSortDesc ? b.weeks_on_chart - a.weeks_on_chart : a.weeks_on_chart - b.weeks_on_chart);
      } else if (this.albumSortBy === 'name') {
        albums.sort((a, b) => this.albumSortDesc ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name));
      } else if (this.albumSortBy === 'debut_date') {
        albums.sort((a, b) => this.albumSortDesc ? moment(b.debut_date).valueOf() - moment(a.debut_date).valueOf() : moment(a.debut_date).valueOf() - moment(b.debut_date).valueOf());
      } else {
        albums.sort((a, b) => this.albumSortDesc ? b.peak_position - a.peak_position : a.peak_position - b.peak_position);
      }
      
      return albums;
    },
    sortedTracks(): any[] {
      if (!this.artistInfo) return [];
      const tracks = [...this.artistInfo.tracks];
      
      if (this.trackSortBy === 'weeks_on_chart') {
        tracks.sort((a, b) => this.trackSortDesc ? b.weeks_on_chart - a.weeks_on_chart : a.weeks_on_chart - b.weeks_on_chart);
      } else if (this.trackSortBy === 'name') {
        tracks.sort((a, b) => this.trackSortDesc ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name));
      } else if (this.trackSortBy === 'debut_date') {
        tracks.sort((a, b) => this.trackSortDesc ? moment(b.debut_date).valueOf() - moment(a.debut_date).valueOf() : moment(a.debut_date).valueOf() - moment(b.debut_date).valueOf());
      } else {
        tracks.sort((a, b) => this.trackSortDesc ? b.peak_position - a.peak_position : a.peak_position - b.peak_position);
      }
      
      return tracks;
    }
  },
  methods: {
    formatDateFull(dateString: string): string {
      if (!dateString) return '-';
      return moment(dateString).format('MMMM D, YYYY');
    },
    
    formatDateShort(dateString: string): string {
      if (!dateString) return '-';
      return moment(dateString).format('MMM D, YYYY');
    },
    
    formatDateGrid(dateString: string): string {
      if (!dateString) return '-';
      return moment(dateString).format('MMM D');
    },
    
    formatNumber(num: number): string {
      if (!num) return '0';
      return num.toLocaleString();
    },
    
    scrollToPosition(date: string) {
      console.log('Scroll to date:', date);
    },
    
    setAlbumSort(sortBy: string) {
      if (this.albumSortBy === sortBy) {
        this.albumSortDesc = !this.albumSortDesc;
      } else {
        this.albumSortBy = sortBy;
        this.albumSortDesc = false;
      }
    },
    
    setTrackSort(sortBy: string) {
      if (this.trackSortBy === sortBy) {
        this.trackSortDesc = !this.trackSortDesc;
      } else {
        this.trackSortBy = sortBy;
        this.trackSortDesc = false;
      }
    },
    
    toggleAlbumSortOrder() {
      this.albumSortDesc = !this.albumSortDesc;
    },
    
    toggleTrackSortOrder() {
      this.trackSortDesc = !this.trackSortDesc;
    },
    
    getPositionCount(position: number): number {
      if (!this.artistInfo) return 0;
      return this.artistInfo.chartHistory.filter(p => p.position === position).length;
    },
    
    getPeakPosition(): number {
      if (!this.selectedItem || !this.selectedItem.chartPositions) return 0;
      const positions = this.selectedItem.chartPositions.map((p: any) => p.position);
      return Math.min(...positions);
    },
    
    getPeakWeeksCount(): number {
      if (!this.selectedItem || !this.selectedItem.chartPositions) return 0;
      const peakPosition = this.getPeakPosition();
      return this.selectedItem.chartPositions.filter((p: any) => p.position === peakPosition).length;
    },
    
    getAveragePosition(): string {
      if (!this.selectedItem || !this.selectedItem.chartPositions) return '-';
      const positions = this.selectedItem.chartPositions.map((p: any) => p.position);
      const avg = positions.reduce((a: number, b: number) => a + b, 0) / positions.length;
      return avg.toFixed(1);
    },
    
    getAlbumPeakPosition(): number {
      if (!this.selectedAlbum || !this.selectedAlbum.chartPositions) return 0;
      const positions = this.selectedAlbum.chartPositions.map((p: any) => p.position);
      return Math.min(...positions);
    },
    
    getAlbumPeakWeeksCount(): number {
      if (!this.selectedAlbum || !this.selectedAlbum.chartPositions) return 0;
      const peakPosition = this.getAlbumPeakPosition();
      return this.selectedAlbum.chartPositions.filter((p: any) => p.position === peakPosition).length;
    },
    
    getAlbumAveragePosition(): string {
      if (!this.selectedAlbum || !this.selectedAlbum.chartPositions) return '-';
      const positions = this.selectedAlbum.chartPositions.map((p: any) => p.position);
      const avg = positions.reduce((a: number, b: number) => a + b, 0) / positions.length;
      return avg.toFixed(1);
    },
    
    getTrackPeakPosition(): number {
      if (!this.selectedTrack || !this.selectedTrack.chartPositions) return 0;
      const positions = this.selectedTrack.chartPositions.map((p: any) => p.position);
      return Math.min(...positions);
    },
    
    getTrackPeakWeeksCount(): number {
      if (!this.selectedTrack || !this.selectedTrack.chartPositions) return 0;
      const peakPosition = this.getTrackPeakPosition();
      return this.selectedTrack.chartPositions.filter((p: any) => p.position === peakPosition).length;
    },
    
    getTrackAveragePosition(): string {
      if (!this.selectedTrack || !this.selectedTrack.chartPositions) return '-';
      const positions = this.selectedTrack.chartPositions.map((p: any) => p.position);
      const avg = positions.reduce((a: number, b: number) => a + b, 0) / positions.length;
      return avg.toFixed(1);
    },
    
    getPositionChange(entry: any, entryIndex: number, run: any[]): number {
      if (entryIndex === 0) return 0;
      const prevEntry = run[entryIndex - 1];
      return prevEntry.position - entry.position;
    },
    
    getPositionClass(position: number, run: any[], entryIndex: number): string {
      const change = this.getPositionChange(run[entryIndex], entryIndex, run);
      
      if (position === 1) return 'position-number-one';
      if (change <= -5) return 'position-drastic-drop';
      if (position <= 10) return 'position-top-10';
      return 'position-other';
    },
    
    getRunPeakPosition(run: any[]): number {
      const positions = run.map((entry: any) => entry.position);
      return Math.min(...positions);
    },
    
    getRunPeakWeeks(run: any[]): number {
      const peakPosition = this.getRunPeakPosition(run);
      return run.filter((entry: any) => entry.position === peakPosition).length;
    },
    
    generateChartRuns(chartPositions: any[]): any[] {
      if (!chartPositions || chartPositions.length === 0) {
        return [];
      }
      
      const runs = [];
      let currentRun: any[] = [];
      
      for (let i = 0; i < chartPositions.length; i++) {
        const current = chartPositions[i];
        
        if (i === 0) {
          currentRun.push(current);
          continue;
        }
        
        const prev = chartPositions[i - 1];
        const currentDate = moment(current.date);
        const prevDate = moment(prev.date);
        const daysDiff = currentDate.diff(prevDate, 'days');
        
        if (daysDiff <= 8) {
          currentRun.push(current);
        } else {
          if (currentRun.length > 0) {
            runs.push([...currentRun]);
          }
          currentRun = [current];
        }
      }
      
      if (currentRun.length > 0) {
        runs.push(currentRun);
      }
      
      return runs;
    },
    
    getArtistBio(artistName: string): string {
      const bios: { [key: string]: string } = {
        'Taylor Swift': 'American singer-songwriter known for narrative songs about her personal life. One of the best-selling music artists of all time.',
        'Drake': 'Canadian rapper, singer, and songwriter who became a dominant force in hip-hop with numerous chart-topping hits.',
        'The Weeknd': 'Canadian singer, songwriter, and record producer known for his unique voice and dark musical style.',
        'BTS': 'South Korean boy band that has become a global phenomenon in K-pop, breaking numerous records worldwide.',
        'Adele': 'English singer-songwriter known for her powerful vocals and emotional songs that resonate with millions.'
      };
      return bios[artistName] || `${artistName} has made significant impact on the charts with their music.`;
    },
    
    async loadArtistData() {
      this.loading = true;
      const artistName = decodeURIComponent(this.$route.params.artistName);
      const weeks = getUserChartList(this.user, 'week');
      
      if (!weeks || weeks.length === 0) {
        this.loading = false;
        return;
      }
      
      const artistChartHistory: ChartPosition[] = [];
      const albumsMap = new Map();
      const tracksMap = new Map();
      
      // Use Sets to track unique tracks that hit #1 and top 10
      const uniqueNumberOneTracks = new Set<string>();
      const uniqueTopTenTracks = new Set<string>();
      
      for (const week of weeks) {
        const weekDate = week.start || week.date;
        const artistsChart = week.artists || [];
        const albumsChart = week.albums || [];
        const tracksChart = week.tracks || [];
        
        const artistEntry = artistsChart.find((a: any) => a.name === artistName);
        if (artistEntry) {
          artistChartHistory.push({
            date: weekDate,
            position: artistEntry.rank,
            playcount: artistEntry.playcount || 0
          });
        }
        
        const artistAlbums = albumsChart.filter((a: any) => a.artist === artistName);
        for (const album of artistAlbums) {
          if (!albumsMap.has(album.name)) {
            albumsMap.set(album.name, {
              name: album.name,
              positions: [],
              chartData: [],
              peak_position: 100,
              peak_count: 0,
              weeks_on_chart: 0,
              debut_date: weekDate // Set debut date to first appearance
            });
          }
          const albumData = albumsMap.get(album.name);
          albumData.positions.push(album.rank);
          albumData.chartData.push({
            date: weekDate,
            position: album.rank,
            playcount: album.playcount || 0
          });
          if (album.rank < albumData.peak_position) {
            albumData.peak_position = album.rank;
          }
        }
        
        const artistTracks = tracksChart.filter((t: any) => t.artist === artistName);
        for (const track of artistTracks) {
          if (!tracksMap.has(track.name)) {
            tracksMap.set(track.name, {
              name: track.name,
              positions: [],
              chartData: [],
              peak_position: 100,
              peak_count: 0,
              weeks_on_chart: 0,
              debut_date: weekDate // Set debut date to first appearance
            });
          }
          const trackData = tracksMap.get(track.name);
          trackData.positions.push(track.rank);
          trackData.chartData.push({
            date: weekDate,
            position: track.rank,
            playcount: track.playcount || 0
          });
          if (track.rank < trackData.peak_position) {
            trackData.peak_position = track.rank;
          }
        }
      }
      
      // Calculate unique number one and top ten hits from tracks
      const allTracks = Array.from(tracksMap.values());
      for (const track of allTracks) {
        if (track.peak_position === 1) {
          uniqueNumberOneTracks.add(track.name);
        }
        if (track.peak_position <= 10) {
          uniqueTopTenTracks.add(track.name);
        }
      }
      
      const numberOneHits = uniqueNumberOneTracks.size;
      const topTenHits = uniqueTopTenTracks.size;
      
      const albums = Array.from(albumsMap.values()).map((album: any) => {
        const peakCount = album.positions.filter((p: number) => p === album.peak_position).length;
        return {
          name: album.name,
          peak_position: album.peak_position,
          peak_count: peakCount,
          weeks_on_chart: album.positions.length,
          debut_date: album.debut_date,
          chartData: album.chartData.sort((a: any, b: any) => moment(a.date).valueOf() - moment(b.date).valueOf())
        };
      }).sort((a, b) => a.peak_position - b.peak_position);
      
      const tracks = Array.from(tracksMap.values()).map((track: any) => {
        const peakCount = track.positions.filter((p: number) => p === track.peak_position).length;
        return {
          name: track.name,
          peak_position: track.peak_position,
          peak_count: peakCount,
          weeks_on_chart: track.positions.length,
          debut_date: track.debut_date,
          chartData: track.chartData.sort((a: any, b: any) => moment(a.date).valueOf() - moment(b.date).valueOf())
        };
      }).sort((a, b) => a.peak_position - b.peak_position);
      
      const positions = artistChartHistory.map(p => p.position);
      const peakPosition = positions.length > 0 ? Math.min(...positions) : 0;
      const peakCount = positions.filter(p => p === peakPosition).length;
      
      this.artistInfo = {
        name: artistName,
        bio: this.getArtistBio(artistName),
        isTopArtist: peakPosition === 1,
        totalWeeksOnChart: artistChartHistory.length,
        peakPosition: peakPosition,
        peakCount: peakCount,
        numberOneHits: numberOneHits,
        topTenHits: topTenHits,
        albums: albums,
        tracks: tracks,
        chartHistory: artistChartHistory
      };
      
      this.loading = false;
    },
    
    viewChartHistory() {
      if (!this.artistInfo) return;
      
      const chartPositions = [...this.artistInfo.chartHistory];
      for (let i = 0; i < chartPositions.length; i++) {
        if (i > 0) {
          chartPositions[i].position_change = chartPositions[i-1].position - chartPositions[i].position;
        }
      }
      
      this.selectedItem = {
        name: this.artistInfo.name,
        chartPositions: chartPositions
      };
      
      this.chartRuns = this.generateChartRuns(chartPositions);
      this.showChartModal = true;
    },
    
    viewAlbumHistory(album: any) {
      const chartPositions = [...album.chartData];
      for (let i = 0; i < chartPositions.length; i++) {
        if (i > 0) {
          chartPositions[i].position_change = chartPositions[i-1].position - chartPositions[i].position;
        }
      }
      
      this.selectedAlbum = {
        name: album.name,
        chartPositions: chartPositions
      };
      
      this.albumChartRuns = this.generateChartRuns(chartPositions);
      this.showAlbumModal = true;
    },
    
    viewTrackHistory(track: any) {
      const chartPositions = [...track.chartData];
      for (let i = 0; i < chartPositions.length; i++) {
        if (i > 0) {
          chartPositions[i].position_change = chartPositions[i-1].position - chartPositions[i].position;
        }
      }
      
      this.selectedTrack = {
        name: track.name,
        chartPositions: chartPositions
      };
      
      this.trackChartRuns = this.generateChartRuns(chartPositions);
      this.showTrackModal = true;
    }
  },
  mounted() {
    this.loadArtistData();
  }
});
</script>

<style scoped>
/* Keep all existing styles from the previous response */
.stat-card-mini {
  text-align: center;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  transition: all 0.2s ease;
}

.stat-card-mini:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.stat-value-mini {
  font-size: 1.5rem;
  font-weight: bold;
  color: #dc3545;
}

.stat-label-mini {
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 5px;
}

.theme-dark .stat-label-mini {
  color: #adb5bd;
}

.gold-star-text {
  color: #ffd700;
  font-weight: bold;
  text-shadow: 0 0 2px rgba(0,0,0,0.3);
}

.artist-avatar {
  color: #6c757d;
}

.title {
  width: 70%;
}

.chart-runs-grid {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.theme-dark .chart-runs-grid {
  background: #1e1e1e;
}

.chart-runs-header {
  margin-bottom: 15px;
  border-bottom: 2px solid #dee2e6;
  padding-bottom: 10px;
}

.chart-run-section {
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: 1px solid #dee2e6;
}

.run-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9ecef;
  flex-wrap: wrap;
  gap: 8px;
}

.run-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.chart-entry {
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 10px;
  text-align: center;
  transition: all 0.2s ease;
}

.chart-entry.peak-number-one {
  border: 2px solid #ffd700;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05));
}

.chart-entry.drastic-drop {
  border: 2px solid #dc3545;
  background: linear-gradient(135deg, rgba(220, 53, 69, 0.15), rgba(220, 53, 69, 0.05));
}

.position {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.position-number-one {
  color: #ffd700;
  text-shadow: 0 0 3px rgba(255, 215, 0, 0.5);
}

.position-drastic-drop {
  color: #dc3545;
}

.position-top-10 {
  color: #007bff;
}

.position-other {
  color: #6c757d;
}

.peak-star {
  font-size: 0.9rem;
  margin-left: 2px;
}

.gold-star {
  color: #ffd700;
}

.drop-indicator {
  color: #dc3545;
  font-size: 0.8rem;
  margin-left: 3px;
}

.date {
  font-size: 0.85rem;
  color: #495057;
  margin-bottom: 3px;
}

.plays {
  font-size: 0.75rem;
  color: #6c757d;
}

.summary-stats {
  margin-top: 20px;
}

.stat-card {
  text-align: center;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #dc3545;
}

.stat-sub {
  font-size: 0.9rem;
  color: #6c757d;
}

.stat-label {
  font-size: 0.85rem;
  color: #6c757d;
  margin-top: 5px;
}

.gold-badge {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #856404;
  font-weight: bold;
  border: none;
}

@media (max-width: 768px) {
  .run-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
</style>