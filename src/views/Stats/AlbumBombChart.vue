<template>
  <b-container>
    <!-- Debug Button -->
    <b-button @click="debugData" variant="info" class="mb-3">
      🐛 Debug Data
    </b-button>

    <!-- Last.fm Settings Button -->
    <b-button v-b-modal.lastfm-settings-modal variant="outline-secondary" class="mb-3 ml-2">
      🎵 Last.fm Settings
    </b-button>

    <!-- Refresh Data Button -->
    <b-button
      @click="refreshWithLastFm"
      variant="success"
      class="mb-3 ml-2"
      :disabled="!canUseLastFm || loading"
    >
      🔄 Refresh with Last.fm
    </b-button>

    <!-- MAIN COMPONENT -->
    <b-card
      class="mt-3 shadow border-0"
      :bg-variant="theme === 'light' ? 'white' : 'dark'"
      :text-variant="theme === 'light' ? 'dark' : 'white'"
    >
      <b-card-title>🎤 Artist Bomb Chart</b-card-title>
      <b-card-subtitle class="mb-3 text-muted">
        When an artist has 7+ songs debuting in a single week
      </b-card-subtitle>

      <!-- Last.fm Status -->
      <b-alert :variant="lastFmStatusVariant" show class="mb-3" v-if="lastFmStatus">
        <small>{{ lastFmStatus }}</small>
      </b-alert>

      <!-- Filters -->
      <b-row class="mb-3">
        <b-col md="6">
          <b-form-group label="Min Songs" label-size="sm">
            <b-form-input
              v-model.number="minSongsFilter"
              type="number"
              min="7"
              max="20"
              size="sm"
            ></b-form-input>
          </b-form-group>
        </b-col>
        <b-col md="6">
          <b-form-group label="Artist Filter" label-size="sm">
            <b-form-input
              v-model="artistFilter"
              placeholder="Filter by artist..."
              size="sm"
            ></b-form-input>
          </b-form-group>
        </b-col>
      </b-row>

      <!-- Loading state -->
      <div v-if="loading" class="text-center py-4">
        <b-spinner variant="primary"></b-spinner>
        <p class="mt-2">Loading artist bombs...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredItems.length === 0" class="text-center py-4">
        <p>No artist bombs found. An artist bomb occurs when an artist has 7 or more songs debuting in a single week.</p>
      </div>

      <b-table
        v-else
        :items="filteredItems"
        :fields="fields"
        small
        striped
        responsive
        :dark="theme === 'dark'"
      >
        <template #cell(artist)="row">
          <div>
            <span class="font-weight-bold">{{ row.item.artist }}</span>
            <b-badge
              variant="secondary"
              v-if="row.item.artistIsVarious"
              title="Multiple artists on this album"
              class="ml-2"
            >Various</b-badge>
          </div>
          <small class="d-block text-muted" v-if="row.item.album">
            Album: {{ row.item.album }}
          </small>
        </template>

        <template #cell(count)="row">
          <b-badge :variant="bombVariant(row.item.count)" class="p-2">
            {{ row.item.count }} songs
          </b-badge>
          <small class="d-block text-muted mt-1">
            {{ row.item.uniqueArtists }} artist{{ row.item.uniqueArtists > 1 ? 's' : '' }}
          </small>
        </template>

        <template #cell(week)="row">
          <div class="week-info">
            <span class="d-block font-weight-bold">{{ formatDate(row.item.week_end) }}</span>
          </div>
        </template>

        <template #cell(actions)="row">
          <b-button size="sm" variant="outline-primary" @click="openBomb(row.item)">
            View Details
          </b-button>
          <b-button
            size="sm"
            variant="outline-info"
            @click="enhanceBomb(row.item, true)"
            :disabled="!canUseLastFm"
            class="ml-1"
            title="Enhance with Last.fm"
          >🎵</b-button>
        </template>
      </b-table>
    </b-card>

    <!-- BOMB DETAIL MODAL -->
    <b-modal
      v-model="showModal"
      size="xl"
      hide-footer
      scrollable
      :title="modalTitle"
    >
      <div v-if="selectedBomb">
        <!-- Artist Bomb Header -->
        <div class="artist-header mb-4 p-3 border rounded bg-primary bg-opacity-10">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h3 class="mb-1">{{ selectedBomb.artist }}</h3>
              <div class="text-muted">
                <b-badge variant="secondary">Album: {{ selectedBomb.album }}</b-badge>
                <span v-if="selectedBomb.artistIsVarious" class="ml-2">
                  <b-badge variant="secondary">Various Artists</b-badge>
                </span>
              </div>
            </div>
            <div class="text-right">
              <b-badge variant="danger" class="p-2">
                💣 {{ selectedBomb.count }} songs
              </b-badge>
              <div class="mt-1">
                <b-badge variant="info">{{ formatDate(selectedBomb.week_end) }}</b-badge>
              </div>
            </div>
          </div>
        </div>

        <!-- Artist Stats -->
        <b-row class="mb-4">
          <b-col md="4">
            <div class="text-center p-3 border rounded">
              <h5>{{ selectedBomb.count }}</h5>
              <small class="text-muted">Total Songs</small>
            </div>
          </b-col>
          <b-col md="4">
            <div class="text-center p-3 border rounded">
              <h5>{{ selectedBomb.uniqueArtists }}</h5>
              <small class="text-muted">Unique Artists</small>
              <div class="small text-muted">(including features)</div>
            </div>
          </b-col>
          <b-col md="4">
            <div class="text-center p-3 border rounded">
              <h5>{{ selectedBomb.trackCount || '—' }}</h5>
              <small class="text-muted">Album Track Count</small>
            </div>
          </b-col>
        </b-row>

        <!-- Enhancement Status -->
        <b-alert :variant="selectedBomb.lastFmEnhanced ? 'success' : 'info'" show class="mb-4">
          <small>
            <strong>Album Detection:</strong>
            {{ selectedBomb.enhancementStatus || 'Using local data' }}
            <span v-if="selectedBomb.lastFmEnhanced">(Enhanced with Last.fm)</span>
            <span v-if="selectedBomb.confidence">
              • Confidence:
              <b-badge :variant="confidenceVariant(selectedBomb.confidence)">
                {{ selectedBomb.confidence }}
              </b-badge>
            </span>
          </small>
        </b-alert>

        <!-- Bomb Week Highlight -->
        <div class="bomb-week mb-4 p-3 border rounded bg-danger bg-opacity-10">
          <h6 class="mb-2">💣 Bomb Week</h6>
          <div class="d-flex align-items-center">
            <b-badge variant="dark" class="p-2 mr-3">
              {{ selectedBomb.count }} songs debuted
            </b-badge>
            <div>
              <div class="font-weight-bold">{{ formatDate(selectedBomb.week_end) }}</div>
              <small class="text-muted">All songs from {{ selectedBomb.album }} debuted this week</small>
            </div>
          </div>
        </div>

        <!-- FEATURED ARTISTS BREAKDOWN -->
        <h6 class="mt-4 mb-3">Featured Artists Breakdown</h6>
        <b-row>
          <b-col v-if="selectedBomb.artistBreakdown && selectedBomb.artistBreakdown.length > 0">
            <b-list-group>
              <b-list-group-item
                v-for="artist in selectedBomb.artistBreakdown"
                :key="artist.artist"
                class="d-flex justify-content-between align-items-center"
              >
                <div>
                  {{ artist.artist }}
                  <small v-if="artist.artist !== selectedBomb.artist" class="text-muted d-block">
                    Featured on {{ selectedBomb.album }}
                  </small>
                </div>
                <b-badge variant="primary" pill>{{ artist.count }} song{{ artist.count > 1 ? 's' : '' }}</b-badge>
              </b-list-group-item>
            </b-list-group>
          </b-col>
        </b-row>

        <!-- SONG LIST -->
        <h6 class="mt-4 mb-3">All Songs in This Bomb</h6>
        <b-table
          :items="selectedBomb.songs"
          :fields="songFields"
          small
          bordered
          striped
          hover
        >
          <template #cell(name)="row">
            <div>
              <span class="font-weight-semibold">{{ row.item.name }}</span>
              <small class="d-block text-muted" v-if="row.item.lastFmData">
                🎵
                <span v-if="row.item.lastFmData.playcount">
                  {{ Number(row.item.lastFmData.playcount).toLocaleString() }} plays
                </span>
                <span v-if="row.item.lastFmData.listeners">
                  • {{ Number(row.item.lastFmData.listeners).toLocaleString() }} listeners
                </span>
              </small>
            </div>
          </template>

          <template #cell(artist)="row">
            <div>
              {{ row.item.artist }}
              <b-badge v-if="row.item.artist === selectedBomb.artist" variant="primary" size="sm" class="ml-1">
                Main
              </b-badge>
              <small v-if="row.item.artist !== selectedBomb.artist" class="text-muted d-block">
                Featuring
              </small>
            </div>
          </template>

          <template #cell(position)="row">
            <b-badge v-if="row.item.rank === 1" variant="success" class="p-2">#1</b-badge>
            <b-badge v-else-if="row.item.rank <= 10" variant="info">#{{ row.item.rank }}</b-badge>
            <span v-else class="text-muted">#{{ row.item.rank }}</span>
          </template>

          <template #cell(actions)="row">
            <b-button
              size="sm"
              variant="outline-info"
              @click="searchLastFmForTrack(row.item)"
              :disabled="!canUseLastFm"
              title="Search Last.fm"
            >🎵</b-button>
          </template>
        </b-table>
      </div>
    </b-modal>

    <!-- LAST.FM SETTINGS MODAL -->
    <b-modal id="lastfm-settings-modal" title="Last.fm API Settings" hide-footer>
      <b-form-group label="Last.fm API Key">
        <b-form-input
          v-model="lastFmApiKey"
          type="password"
          placeholder="Enter your Last.fm API Key"
          @change="saveSettingsDebounced"
        ></b-form-input>
      </b-form-group>

      <b-form-group label="Enable Last.fm Integration">
        <b-form-checkbox v-model="enableLastFm" switch @change="saveSettingsDebounced">
          Use Last.fm to detect albums
        </b-form-checkbox>
      </b-form-group>

      <b-form-group label="Auto-enhance on load">
        <b-form-checkbox v-model="autoEnhance" switch @change="saveSettingsDebounced">
          Automatically enhance bombs with Last.fm
        </b-form-checkbox>
      </b-form-group>

      <b-form-group label="Max API requests per session">
        <b-form-input
          v-model.number="maxRequestsPerSession"
          type="number"
          min="10"
          max="500"
          @change="saveSettingsDebounced"
        ></b-form-input>
        <small class="text-muted">Limits total Last.fm calls to avoid runaway requests.</small>
      </b-form-group>

      <div class="mt-3">
        <b-alert variant="info" show>
          <small>
            <strong>Note:</strong> Last.fm API has a limit of
            5 requests per second per IP address. No daily limit for authenticated requests.
          </small>
        </b-alert>

        <b-alert variant="warning" show v-if="canUseLastFm">
          <small>
            API Key Status: <b-badge variant="success">Configured</b-badge><br />
            Requests this session: {{ lastFmRequestCount }} / {{ maxRequestsPerSession }}
          </small>
        </b-alert>
      </div>
    </b-modal>

    <!-- DEBUG MODAL -->
    <b-modal v-model="showDebugModal" size="lg" title="Debug Data">
      <pre>{{ debugDataResult }}</pre>
    </b-modal>
  </b-container>
</template>

<script lang="ts">
import moment from 'moment';
import { Vue } from 'vue-property-decorator';
import { getUserChartList } from '@/charts/helpers';
import axios from 'axios';

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface LastFmTrackData {
  name: string;
  artist: string | { name: string };
  album?: { title: string };
  url: string;
  duration?: string;
  playcount?: number | string;
  listeners?: number | string;
  toptags?: { tag: Array<{ name: string; url: string }> };
  wiki?: { published: string; summary: string; content: string };
}

interface AlbumInfo {
  albumName: string;
  confidence: 'high' | 'medium' | 'low' | 'unknown';
  source: 'local' | 'lastfm' | 'manual';
  lastFmData?: LastFmTrackData;
  lastFmPlaycount?: number;
  lastFmListeners?: number;
  tags?: string[];
  trackCount?: number;
  artistName?: string;
  releaseDate?: string;
}

interface Song {
  name: string;
  artist: string;
  album: string;
  rank: number;
  albumSource?: string;
  confidence?: string;
  originalAlbum?: string;
  albumInfo?: AlbumInfo;
  lastFmData?: LastFmTrackData;
}

interface Bomb {
  album: string;
  artist: string;
  week_end: string;
  count: number;
  songs: Song[];
  trackCount?: number;
  uniqueArtists: number;
  artistBreakdown: Array<{ artist: string; count: number }>;
  artistIsVarious: boolean;
  lastFmEnhanced: boolean;
  enhancementStatus: string;
  albumInfo?: AlbumInfo;
  confidence?: string;
}

interface ArtistAlbums {
  [albumName: string]: string[];
}

interface KnownAlbums {
  [artistName: string]: ArtistAlbums;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default Vue.extend({
  name: 'ArtistBombChart',

  data() {
    return {
      items: [] as Bomb[],
      showModal: false,
      selectedBomb: null as Bomb | null,
      loading: true,
      showDebugModal: false,
      debugDataResult: {} as any,

      // Last.fm settings
      lastFmApiKey: '' as string,
      enableLastFm: false as boolean,
      autoEnhance: false as boolean,
      lastFmRequestCount: 0 as number,
      maxRequestsPerSession: 100 as number,
      lastFmStatus: '' as string,

      // Rate limiting
      lastFmRateLimit: 5,
      lastFmLastBatchTime: 0 as number,

      lastFmCache: new Map<string, AlbumInfo>(),
      trackAlbumMap: new Map<string, AlbumInfo>(),

      knownArtistAlbums: {
        'ariana grande': {
          'eternal sunshine': [
            'intro (end of the world)', 'bye', "don't wanna break up again",
            'saturn returns interlude', 'eternal sunshine', 'supernatural',
            'true story', 'the boy is mine', 'yes, and?',
            "we can't be friends (wait for your love)", 'i wish i hated you',
            'imperfect for you', 'ordinary things'
          ],
          'yours truly': [
            'honeymoon avenue', 'baby i', 'right there', 'tattooed heart',
            "lovin' it", 'piano', "daydreamin'", 'the way',
            "you'll never know", 'almost is never enough'
          ],
          'my everything': [
            'intro', 'problem', 'one last time', 'why try', 'break free',
            'best mistake', 'be my baby', 'break your heart right back',
            'love me harder', 'just a little bit of your heart',
            'hands on me', 'my everything'
          ],
          'dangerous woman': [
            'moonlight', 'dangerous woman', 'be alright', 'into you',
            'side to side', 'let me love you', 'greedy', 'leave me lonely',
            'everyday', 'sometimes', "i don't care", 'bad decisions',
            'touch it', 'knew better / forever boy', 'thinking bout you'
          ],
          'thank u, next': [
            'imagine', 'needy', 'nasa', 'bloodline', 'fake smile',
            'bad idea', 'make up', 'ghostin', 'in my head', '7 rings',
            'thank u, next', "break up with your girlfriend, i'm bored"
          ],
          positions: [
            'shut up', '34+35', 'motive', 'just like magic', 'off the table',
            'six thirty', 'safety net', 'my hair', 'nasty', 'west side',
            'love language', 'positions', 'obvious', 'pov'
          ]
        },
        'taylor swift': {
          '1989': [
            'welcome to new york', 'blank space', 'style', 'out of the woods',
            'all you had to do was stay', 'shake it off', 'i wish you would',
            'bad blood', 'wildest dreams', 'how you get the girl',
            'this love', 'i know places', 'clean'
          ],
          reputation: [
            'ready for it', 'end game', 'i did something bad', "don't blame me",
            'delicate', 'look what you made me do', 'so it goes', 'gorgeous',
            'getaway car', 'king of my heart', 'dancing with our hands tied',
            'dress', "this is why we can't have nice things",
            'call it what you want', "new year's day"
          ],
          lover: [
            'i forgot that you existed', 'cruel summer', 'lover', 'the man',
            'the archer', 'i think he knows',
            'miss americana & the heartbreak prince', 'paper rings',
            'cornelia street', 'death by a thousand cuts', 'london boy',
            "soon you'll get better", 'false god', 'you need to calm down',
            'afterglow', 'me!', "it's nice to have a friend", 'daylight'
          ]
        }
      } as KnownAlbums,

      minSongsFilter: 7 as number,
      artistFilter: '' as string,

      _saveSettingsTimer: null as ReturnType<typeof setTimeout> | null,

      fields: [
        { key: 'artist',  label: 'Artist',         sortable: true },
        { key: 'count',   label: 'Bomb Size',      sortable: true, class: 'text-center' },
        { key: 'week',    label: 'Bomb Week',      sortable: true },
        { key: 'actions', label: '',               class: 'text-center w-15' }
      ],

      songFields: [
        { key: 'name',     label: 'Song' },
        { key: 'artist',   label: 'Artist' },
        { key: 'position', label: 'Position', class: 'text-center' },
        { key: 'actions',  label: '',         class: 'text-center' }
      ]
    };
  },

  // ─── Computed ───────────────────────────────────────────────────────────────
  computed: {
    user(): any {
      return this.$store.getters.getDefaultUser;
    },
    theme(): string {
      return this.$store.getters.getTheme;
    },
    modalTitle(): string {
      if (!this.selectedBomb) return 'Artist Bomb Details';
      return `${this.selectedBomb.artist} — ${this.selectedBomb.count} Song Bomb`;
    },
    canUseLastFm(): boolean {
      return (
        this.enableLastFm === true &&
        !!this.lastFmApiKey &&
        this.lastFmApiKey.length > 20
      );
    },
    lastFmStatusVariant(): string {
      if (!this.canUseLastFm) return 'warning';
      if (this.lastFmRequestCount > 50) return 'info';
      return 'success';
    },
    filteredItems(): Bomb[] {
      let filtered = this.items.filter(item => item.count >= this.minSongsFilter);
      if (this.artistFilter) {
        const f = this.artistFilter.toLowerCase();
        filtered = filtered.filter(item => item.artist.toLowerCase().includes(f));
      }
      return filtered;
    }
  },

  // ─── Lifecycle ──────────────────────────────────────────────────────────────
  created() {
    this.loadSettings();
  },

  mounted() {
    this.buildArtistBombs();
  },

  beforeDestroy() {},

  // ─── Methods ────────────────────────────────────────────────────────────────
  methods: {

    // ── Helpers ──────────────────────────────────────────────────────────────
    formatDate(date: string): string {
      return moment(date).format('MMMM D, YYYY');
    },
    bombVariant(count: number): string {
      if (count >= 10) return 'danger';
      if (count >= 5)  return 'primary';
      return 'info';
    },
    confidenceVariant(confidence: string): string {
      const map: Record<string, string> = { high: 'success', medium: 'info', low: 'warning' };
      return map[confidence] ?? 'secondary';
    },

    // ── Settings persistence ─────────────────────────────────────────────────
    loadSettings() {
      try {
        const raw = localStorage.getItem('artistBombLastFmSettings');
        if (raw) {
          const p = JSON.parse(raw);
          this.lastFmApiKey          = p.lastFmApiKey          ?? '';
          this.enableLastFm          = p.enableLastFm          === true;
          this.autoEnhance           = p.autoEnhance           === true;
          this.lastFmRequestCount    = p.lastFmRequestCount    ?? 0;
          this.maxRequestsPerSession = p.maxRequestsPerSession ?? 100;
        }
        const rawCache = localStorage.getItem('lastFmAlbumInfoCache');
        if (rawCache) {
          const parsed = JSON.parse(rawCache) as Record<string, AlbumInfo>;
          this.lastFmCache = new Map(Object.entries(parsed));
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    },

    saveSettingsDebounced() {
      if (this._saveSettingsTimer) clearTimeout(this._saveSettingsTimer);
      this._saveSettingsTimer = setTimeout(() => this.saveSettings(), 500);
    },

    saveSettings() {
      try {
        localStorage.setItem('artistBombLastFmSettings', JSON.stringify({
          lastFmApiKey:          this.lastFmApiKey,
          enableLastFm:          this.enableLastFm,
          autoEnhance:           this.autoEnhance,
          lastFmRequestCount:    this.lastFmRequestCount,
          maxRequestsPerSession: this.maxRequestsPerSession
        }));
        const cacheObj = Object.fromEntries(this.lastFmCache);
        localStorage.setItem('lastFmAlbumInfoCache', JSON.stringify(cacheObj));
      } catch (err) {
        console.warn('Could not persist settings (storage full?):', err);
      }
    },

    // ── Core bomb builder ────────────────────────────────────────────────────
    async buildArtistBombs() {
      try {
        this.loading = true;
        this.lastFmStatus = 'Loading artist bombs…';

        await this.buildTrackAlbumMapping();

        const weeks = getUserChartList(this.user, 'week');
        if (weeks.length === 0) {
          this.lastFmStatus = 'No weekly charts found';
          this.items = [];
          return;
        }

        // Track bombs by artist + album + week
        const bombMap = new Map<string, {
          album: string; artist: string; albumInfo: AlbumInfo;
          trackCount?: number; songs: Song[]; week_end: string;
        }>();

        const sortedWeeks = [...weeks].sort(
          (a, b) => new Date(a.week_end).getTime() - new Date(b.week_end).getTime()
        );

        sortedWeeks.forEach((week: any) => {
          const entries: any[] = week.entries ?? week.tracks ?? week.songs ?? [];
          if (!entries.length) return;
          
          const weekEnd = week.week_end || week.date || week.start;
          if (!weekEnd) return;

          // Track album debuts by artist in this specific week
          const artistDebutsThisWeek = new Map<string, {
            album: string; artist: string; albumInfo: AlbumInfo;
            songsInWeek: Song[];
          }>();

          entries.forEach((e: any) => {
            const isDebut =
              e.is_debut === true || e.isNew === true || e.is_new === true ||
              e.debut === true || e.debut_week === weekEnd ||
              e.previous_rank == null || e.previous_position == null;

            if (!isDebut) return;

            const trackName  = e.name ?? e.title ?? 'Unknown Track';
            const artistName = e.artist ?? 'Unknown Artist';
            const albumInfo  = this.detectAlbumFromTrack(trackName, artistName);
            const bombKey    = `${artistName}||${albumInfo.albumName}`.toLowerCase();

            if (!artistDebutsThisWeek.has(bombKey)) {
              artistDebutsThisWeek.set(bombKey, {
                album: albumInfo.albumName,
                artist: artistName,
                albumInfo,
                songsInWeek: []
              });
            }

            const weekArtist = artistDebutsThisWeek.get(bombKey)!;
            const songExists = weekArtist.songsInWeek.some(
              s => s.name.toLowerCase() === trackName.toLowerCase() &&
                   s.artist.toLowerCase() === artistName.toLowerCase()
            );
            
            if (!songExists) {
              weekArtist.songsInWeek.push({
                name: trackName,
                artist: artistName,
                album: albumInfo.albumName,
                rank: e.rank ?? e.position ?? 0,
                albumSource: albumInfo.source,
                confidence: albumInfo.confidence,
                originalAlbum: e.album,
                albumInfo,
                lastFmData: albumInfo.lastFmData
              } as Song);
            }
          });

          // Check for bombs (7+ songs from same artist/album in this week)
          artistDebutsThisWeek.forEach((weekArtist, bombKey) => {
            if (weekArtist.songsInWeek.length >= 7) {
              const uniqueKey = `${bombKey}||${weekEnd}`;
              if (!bombMap.has(uniqueKey)) {
                bombMap.set(uniqueKey, {
                  album: weekArtist.album,
                  artist: weekArtist.artist,
                  albumInfo: weekArtist.albumInfo,
                  trackCount: weekArtist.albumInfo.trackCount,
                  songs: weekArtist.songsInWeek,
                  week_end: weekEnd
                });
              }
            }
          });
        });

        const bombs: Bomb[] = [];
        bombMap.forEach(data => {
          const uniqueArtists   = new Set<string>(data.songs.map(s => s.artist)).size;
          const artistBreakdown = this.analyzeArtistDistribution(data.songs);
          const lastFmEnhanced  = data.songs.some(s => s.albumSource === 'lastfm');

          bombs.push({
            album:            data.album,
            artist:           data.artist,
            week_end:         data.week_end,
            count:            data.songs.length,
            songs:            data.songs.sort((a, b) => a.rank - b.rank),
            trackCount:       data.trackCount,
            uniqueArtists,
            artistBreakdown,
            artistIsVarious:  uniqueArtists > 1,
            lastFmEnhanced,
            enhancementStatus: lastFmEnhanced ? 'Enhanced with Last.fm' : 'Using local data',
          });
        });

        this.items = bombs.sort((a, b) => b.count - a.count);
        this.lastFmStatus = `Found ${bombs.length} artist bombs`;

        if (this.canUseLastFm && this.autoEnhance && bombs.length > 0) {
          this.lastFmStatus = 'Auto-enhancing with Last.fm…';
          await this.enhanceAllBombs();
        }
      } catch (err) {
        console.error('Error building artist bombs:', err);
        this.lastFmStatus = 'Error building bombs';
        this.items = [];
      } finally {
        this.loading = false;
      }
    },

    async buildTrackAlbumMapping() {
      try {
        const weeks = getUserChartList(this.user, 'week');
        const trackData = new Map<string, { albums: Set<string>; occurrences: number }>();

        weeks.forEach((week: any) => {
          const entries: any[] = week.entries ?? week.tracks ?? week.songs ?? [];
          entries.forEach((entry: any) => {
            const trackName  = entry.name ?? entry.title;
            const artistName = entry.artist;
            const albumName  = entry.album;
            if (!trackName || !artistName || !albumName) return;
            const key = `${artistName}||${trackName}`.toLowerCase();
            if (!trackData.has(key)) trackData.set(key, { albums: new Set(), occurrences: 0 });
            const td = trackData.get(key)!;
            td.albums.add(albumName);
            td.occurrences++;
          });
        });

        trackData.forEach((info, key) => {
          const albums = [...info.albums];
          const confidence: 'high' | 'medium' | 'low' =
            albums.length === 1 && info.occurrences > 1 ? 'high' :
            albums.length === 1 ? 'medium' : 'low';
          this.trackAlbumMap.set(key, { albumName: albums[0], confidence, source: 'local' });
        });

        console.log(`Built local mapping for ${this.trackAlbumMap.size} tracks`);
      } catch (err) {
        console.error('Error building track mapping:', err);
      }
    },

    // ── Album detection ──────────────────────────────────────────────────────
    cleanTrackName(trackName: string): string {
      return trackName
        .toLowerCase()
        .replace(/\s*[-–—]\s*(feat\.?|ft\.?|featuring|with|&).*$/i, '')
        .replace(/\s*\(.*?\)/g, '')
        .replace(/\s*\[.*?\]/g, '')
        .replace(/\s*-\s*(single|remix|edit|mix|version|demo|radio|acoustic|live)$/i, '')
        .trim();
    },

    detectAlbumFromTrack(trackName: string, artistName: string): AlbumInfo {
      const artistKey  = artistName.toLowerCase();
      const cleanTrack = this.cleanTrackName(trackName);

      const artistAlbums = this.knownArtistAlbums[artistKey];
      if (artistAlbums) {
        for (const [albumName, tracks] of Object.entries(artistAlbums)) {
          const match = tracks.find((t: string) => {
            const ct = this.cleanTrackName(t);
            return ct === cleanTrack || ct.includes(cleanTrack) ||
                   cleanTrack.includes(ct) || this.calculateSimilarity(ct, cleanTrack) > 0.8;
          });
          if (match) return { albumName, confidence: 'high', source: 'manual', trackCount: tracks.length };
        }
      }

      const localResult = this.getAlbumForTrackLocal(trackName, artistName);
      if (localResult.confidence === 'high' || localResult.confidence === 'medium') return localResult;

      const fuzzyResult = this.getAlbumForTrackFuzzy(trackName, artistName);
      if (fuzzyResult.confidence === 'medium') return fuzzyResult;

      return { albumName: 'Unknown Album', confidence: 'unknown', source: 'local' };
    },

    getAlbumForTrackLocal(trackName: string, artistName: string): AlbumInfo {
      if (!trackName || !artistName) {
        return { albumName: 'Unknown Album', confidence: 'unknown', source: 'local' };
      }
      const key = `${artistName}||${trackName}`.toLowerCase();
      if (this.trackAlbumMap.has(key)) return this.trackAlbumMap.get(key)!;
      const cacheKey = `track:${artistName}:${trackName}`.toLowerCase();
      if (this.lastFmCache.has(cacheKey)) return this.lastFmCache.get(cacheKey)!;
      return { albumName: 'Unknown Album', confidence: 'unknown', source: 'local' };
    },

    getAlbumForTrackFuzzy(trackName: string, artistName: string): AlbumInfo {
      const cleanTrack = this.cleanTrackName(trackName);
      for (const [mapKey, value] of this.trackAlbumMap.entries()) {
        const [mapArtist, mapTrack] = mapKey.split('||');
        if (mapArtist.toLowerCase() !== artistName.toLowerCase()) continue;
        if (this.isSimilarTrack(cleanTrack, this.cleanTrackName(mapTrack))) {
          return { ...value, confidence: 'medium' };
        }
      }
      return { albumName: 'Unknown Album', confidence: 'unknown', source: 'local' };
    },

    isSimilarTrack(track1: string, track2: string): boolean {
      if (track1 === track2) return true;
      if (track1.includes(track2) || track2.includes(track1)) return true;
      return this.calculateSimilarity(track1, track2) > 0.75;
    },

    calculateSimilarity(str1: string, str2: string): number {
      const set1 = new Set(str1.split(/\s+/));
      const set2 = new Set(str2.split(/\s+/));
      const intersection = [...set1].filter(x => set2.has(x)).length;
      const union = new Set([...set1, ...set2]).size;
      return union === 0 ? 0 : intersection / union;
    },

    analyzeArtistDistribution(songs: Song[]): Array<{ artist: string; count: number }> {
      const map = new Map<string, number>();
      songs.forEach(s => map.set(s.artist, (map.get(s.artist) ?? 0) + 1));
      return [...map.entries()]
        .map(([artist, count]) => ({ artist, count }))
        .sort((a, b) => b.count - a.count);
    },

    // ── Last.fm API ──────────────────────────────────────────────────────────
    async rateLimitDelay() {
      const now = Date.now();
      if (this.lastFmRequestCount > 0 && this.lastFmRequestCount % this.lastFmRateLimit === 0) {
        const elapsed = now - this.lastFmLastBatchTime;
        if (elapsed < 1000) await new Promise(r => setTimeout(r, 1000 - elapsed));
        this.lastFmLastBatchTime = Date.now();
      }
    },

    async callLastFmApi(method: string, params: Record<string, any> = {}): Promise<any> {
      if (this.lastFmRequestCount >= this.maxRequestsPerSession) {
        console.warn('Last.fm request cap reached for this session');
        return null;
      }
      const cacheKey = `${method}:${JSON.stringify(params)}`;
      if (this.lastFmCache.has(cacheKey)) return this.lastFmCache.get(cacheKey);
      await this.rateLimitDelay();
      try {
        const response = await axios.get('https://ws.audioscrobbler.com/2.0/', {
          params: { method, api_key: this.lastFmApiKey, format: 'json', ...params }
        });
        this.lastFmRequestCount++;
        this.saveSettingsDebounced();
        if (response.data?.error) {
          throw new Error(`Last.fm API error ${response.data.error}: ${response.data.message}`);
        }
        return response.data;
      } catch (err: any) {
        if (err.response?.status === 429) {
          console.warn('Last.fm rate-limit hit; waiting 2 s');
          await new Promise(r => setTimeout(r, 2000));
        }
        throw err;
      }
    },

    async searchLastFmTrack(trackName: string, artistName: string): Promise<AlbumInfo | null> {
      const cacheKey = `track:${artistName}:${trackName}`.toLowerCase();
      if (this.lastFmCache.has(cacheKey)) return this.lastFmCache.get(cacheKey)!;
      try {
        const data = await this.callLastFmApi('track.getInfo', {
          artist: artistName, track: trackName, autocorrect: 1
        });
        if (!data?.track) return null;
        const t = data.track as LastFmTrackData;
        const albumInfo: AlbumInfo = {
          albumName:       t.album?.title ?? 'Single',
          confidence:      t.album ? 'high' : 'low',
          source:          'lastfm',
          lastFmData:      t,
          lastFmPlaycount: parseInt(String(t.playcount ?? 0), 10) || 0,
          lastFmListeners: parseInt(String(t.listeners ?? 0), 10) || 0,
          tags:            t.toptags?.tag?.map(tg => tg.name) ?? []
        };
        this.lastFmCache.set(cacheKey, albumInfo);
        this.saveSettingsDebounced();
        return albumInfo;
      } catch (err) {
        console.error(`Last.fm lookup failed for "${artistName} – ${trackName}":`, err);
        return null;
      }
    },

    async refreshWithLastFm() {
      if (!this.canUseLastFm) {
        this.lastFmStatus = 'Please configure Last.fm API first';
        return;
      }
      this.loading = true;
      this.lastFmStatus = 'Refreshing with Last.fm data…';
      try {
        await this.enhanceAllBombs();
        this.lastFmStatus = `Enhanced ${this.items.length} bombs with Last.fm`;
      } catch (err) {
        console.error('Error refreshing with Last.fm:', err);
        this.lastFmStatus = 'Error refreshing with Last.fm';
      } finally {
        this.loading = false;
      }
    },

    async enhanceAllBombs() {
      if (!this.canUseLastFm || this.items.length === 0) return;
      const subset = this.items.slice(0, 10);
      for (let i = 0; i < subset.length; i++) {
        if (this.lastFmRequestCount >= this.maxRequestsPerSession) {
          this.lastFmStatus = 'Request cap reached; stopping auto-enhance';
          break;
        }
        this.lastFmStatus = `Enhancing ${i + 1}/${subset.length} bombs…`;
        await this.enhanceBomb(subset[i], false);
        await new Promise(r => setTimeout(r, 300));
      }
    },

    async enhanceBomb(bomb: Bomb, showAlert = true) {
      if (!this.canUseLastFm) {
        if (showAlert) this.lastFmStatus = 'Please configure Last.fm API first';
        return;
      }
      const enhancedSongs = bomb.songs.map(s => ({ ...s }));
      let enhancedCount = 0;
      for (let i = 0; i < enhancedSongs.length; i++) {
        if (this.lastFmRequestCount >= this.maxRequestsPerSession) break;
        const song = enhancedSongs[i];
        if (song.confidence === 'high' && song.albumSource === 'lastfm') continue;
        try {
          const albumInfo = await this.searchLastFmTrack(song.name, song.artist);
          if (albumInfo && albumInfo.albumName !== 'Unknown Album') {
            enhancedSongs[i] = {
              ...song, album: albumInfo.albumName, albumSource: albumInfo.source,
              confidence: albumInfo.confidence, albumInfo, lastFmData: albumInfo.lastFmData
            };
            enhancedCount++;
          }
        } catch (err) {
          console.error(`Failed to enhance "${song.name}":`, err);
        }
        await new Promise(r => setTimeout(r, 200));
      }
      if (enhancedCount > 0) {
        const uniqueArtists   = new Set(enhancedSongs.map(s => s.artist)).size;
        const artistBreakdown = this.analyzeArtistDistribution(enhancedSongs);
        const updated: Bomb = {
          ...bomb, songs: enhancedSongs, uniqueArtists, artistBreakdown,
          artistIsVarious: uniqueArtists > 1, lastFmEnhanced: true,
          enhancementStatus: `Enhanced ${enhancedCount} songs with Last.fm`
        };
        const idx = this.items.findIndex(
          item => item.album === bomb.album && item.artist === bomb.artist && item.week_end === bomb.week_end
        );
        if (idx !== -1) this.$set(this.items, idx, updated);
        if (this.selectedBomb?.album === bomb.album && this.selectedBomb?.artist === bomb.artist &&
            this.selectedBomb?.week_end === bomb.week_end) {
          this.selectedBomb = updated;
        }
        if (showAlert) this.lastFmStatus = `Enhanced ${enhancedCount} songs in "${bomb.album}"`;
      } else if (showAlert) {
        this.lastFmStatus = 'No new data found on Last.fm';
      }
    },

    async searchLastFmForTrack(song: Song) {
      if (!this.canUseLastFm) {
        this.lastFmStatus = 'Please configure Last.fm API first';
        return;
      }
      try {
        this.lastFmStatus = `Searching Last.fm for "${song.name}"…`;
        const albumInfo = await this.searchLastFmTrack(song.name, song.artist);
        if (albumInfo && this.selectedBomb) {
          const idx = this.selectedBomb.songs.findIndex(
            s => s.name === song.name && s.artist === song.artist
          );
          if (idx !== -1) {
            const updatedSong: Song = {
              ...song, album: albumInfo.albumName, albumSource: albumInfo.source,
              confidence: albumInfo.confidence, albumInfo, lastFmData: albumInfo.lastFmData
            };
            this.$set(this.selectedBomb.songs, idx, updatedSong);
            this.selectedBomb.artistBreakdown = this.analyzeArtistDistribution(this.selectedBomb.songs);
            this.lastFmStatus = `Found album: ${albumInfo.albumName}`;
          }
        } else {
          this.lastFmStatus = 'No data found on Last.fm';
        }
      } catch (err) {
        console.error('Error searching Last.fm:', err);
        this.lastFmStatus = 'Error searching Last.fm';
      }
    },

    // ── Modal openers ────────────────────────────────────────────────────────
    openBomb(bomb: Bomb) {
      this.selectedBomb = bomb;
      this.showModal    = true;
    },

    // ── Debug ────────────────────────────────────────────────────────────────
    debugData() {
      const weeks = getUserChartList(this.user, 'week');
      if (weeks.length === 0) {
        this.debugDataResult = { error: 'No weeks found for user' };
        this.showDebugModal  = true;
        return;
      }
      const lastFmTest: any = this.canUseLastFm
        ? {
            status: 'Configured', apiKeyLength: this.lastFmApiKey.length,
            requestCount: this.lastFmRequestCount, requestCap: this.maxRequestsPerSession,
            cacheSize: this.lastFmCache.size, rateLimit: `${this.lastFmRateLimit} req/s`
          }
        : { status: 'Not configured' };

      const firstWeek = weeks[0];
      const entries: any[] = firstWeek.entries ?? firstWeek.tracks ?? firstWeek.songs ?? [];
      const sampleTrack = entries.length ? (() => {
        const e  = entries[0];
        const ai = this.detectAlbumFromTrack(e.name ?? e.title, e.artist);
        return { track: e.name ?? e.title, artist: e.artist, localAlbum: e.album,
                 detectedAlbum: ai.albumName, source: ai.source, confidence: ai.confidence };
      })() : null;

      this.debugDataResult = {
        basicInfo:   { totalWeeks: weeks.length, user: this.user?.login, bombsFound: this.items.length },
        lastFm:      lastFmTest,
        caches:      { trackAlbumMap: this.trackAlbumMap.size, lastFmCache: this.lastFmCache.size },
        sampleTrack
      };
      this.showDebugModal = true;
    }
  }
});
</script>

<style scoped>
.week-info {
  line-height: 1.3;
}
.bg-opacity-10 {
  background-color: rgba(var(--primary-rgb), 0.1);
}
</style>