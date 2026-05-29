<template>
  <div>
    <b-container>
      <b-row v-if="user.weeklyCharts?.weeks?.length">
        <b-col class="px-0 px-sm-3">
          <b-card class="mb-4 mt-3 shadow border-0"
                  :bg-variant="theme === 'light' ? 'white' : 'dark'"
                  :text-variant="theme === 'light' ? 'dark' : 'white'"
                  id="chart">
            <b-card-title>
              {{ $tc('stats.artist_tracks.title', rank, { number: rank }) }}
            </b-card-title>
            <b-card-body>
              <b-row>
                <b-col order-sm="1" order-md="1" sm="12" md="4" lg="3">
                  <b-input-group class="mb-2">
                    <b-input-group-prepend>
                      <b-btn href="#" variant="danger">
                        {{ $t('chart.top') }}:
                      </b-btn>
                    </b-input-group-prepend>
                    <b-select v-model="rank" name="rank" :options="rankings" required></b-select>
                  </b-input-group>
                  <b-input-group class="mb-3">
                    <b-input-group-prepend>
                      <b-btn href="#" variant="danger">
                        {{ $tc('word.year', 1) }}:
                      </b-btn>
                    </b-input-group-prepend>
                    <b-select v-model="year" name="year" :options="years" required></b-select>
                  </b-input-group>
                </b-col>
                <b-col order-sm="2" order-md="2" sm="12" md="8" lg="9" class="text-right">
                  <b-button-group class="d-sm-flex d-md-block">
                    <b-button variant="danger" :disabled="tp === 'albums'" :to="{ name: 'weekly.stats.artist_tracks', params: { type: 'albums' } }" @click="loadCharts"><font-awesome-icon data-html2canvas-ignore="true" :icon="['fa', 'compact-disc']" /> {{ $tc("word.album", 2) }}</b-button>
                    <b-button variant="danger" :disabled="tp === 'tracks'" :to="{ name: 'weekly.stats.artist_tracks', params: { type: 'tracks' } }" @click="loadCharts"><font-awesome-icon data-html2canvas-ignore="true" :icon="['fa', 'music']" /> {{ $tc("word.track", 2) }}</b-button>
                  </b-button-group>
                </b-col>
              </b-row>
              <b-table
                  :fields="fields"
                  :items="items"
                  :class="'bg-' + theme + ' chart-table mt-4'"
                  responsive="lg"
                  :sort-by.sync="sortBy"
                  :sort-desc.sync="sortDesc"
                  :dark="theme === 'dark'"
                  :striped="true"
                  :small="true">
                <template #cell(ranking)="row">
                  <span class="d-block text-center font-weight-bold">{{ row.index + 1 }}</span>
                </template>
                <template #cell(name_artist)="row">
                  <span class="d-block">{{ row.item.name }}</span>
                  <span class="d-block sub text-muted small">{{ row.item.artist }}</span>
                </template>
                <template #cell(total_items)="row">
                  <span class="d-block text-center">{{ row.item.total_items || 0 }}</span>
                </template>
                <template #cell(total_weeks)="row">
                  <span class="d-block text-center">{{ row.item.total_weeks || 0 }}</span>
                </template>
                <template #cell(actions)="row">
                  <b-button variant="info" size="sm" @click="showArtistNumberOnes(row.item)">
                    <font-awesome-icon data-html2canvas-ignore="true" :icon="['fa', 'music']" />
                    {{ $t('chart.show_number_ones') }}
                  </b-button>
                </template>
              </b-table>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
      <b-row v-else>
        <b-col>
          <b-card class="mb-4 mt-3 shadow border-0"
                  :bg-variant="theme === 'light' ? 'white' : 'dark'"
                  :text-variant="theme === 'light' ? 'dark' : 'white'"
                  id="chart">
            <b-card-body>{{ $t("messages.require_update") }}</b-card-body>
          </b-card>
        </b-col>
      </b-row>
    </b-container>

    <!-- Modal to show artist's #1 items -->
    <b-modal 
      v-model="showModal" 
      :title="modalTitle"
      size="lg"
      :header-bg-variant="theme === 'light' ? 'light' : 'dark'"
      :header-text-variant="theme === 'light' ? 'dark' : 'white'"
      :body-bg-variant="theme === 'light' ? 'white' : 'dark'"
      :body-text-variant="theme === 'light' ? 'dark' : 'white'"
      :footer-bg-variant="theme === 'light' ? 'light' : 'dark'"
      :footer-text-variant="theme === 'light' ? 'dark' : 'white'"
      ok-only>
      <div v-if="modalItems.length === 0" class="text-center py-4">
        {{ $t('messages.no_number_ones_found') }}
      </div>
      <b-table
        v-else
        :fields="modalFields"
        :items="modalItems"
        responsive
        :dark="theme === 'dark'"
        :striped="true"
        :small="true"
        hover>
        <template #cell(name)="row">
          <span class="d-block font-weight-semibold">{{ row.item.name }}</span>
          <span v-if="row.item.artist && tp === 'tracks'" class="d-block small text-muted">{{ row.item.artist }}</span>
        </template>
        <template #cell(number_ones)="row">
          <span class="d-block text-center font-weight-bold text-danger">{{ row.item.number_ones }}x</span>
        </template>
        <template #cell(weeks_on_chart)="row">
          <div class="weeks-info">
            <span class="d-block font-weight-bold">
              {{ row.item.weeks_on_chart || 0 }} 
              {{ $tc('word.weeks', row.item.weeks_on_chart || 0) }}
              <span v-if="row.item.still_charting" class="text-danger">*</span>
            </span>
          </div>
        </template>
        <template #cell(peak_info)="row">
          <div class="peak-info">
            <span class="d-block font-weight-bold text-success">#{{ row.item.peak_position }}</span>
            <span class="d-block small text-muted">{{ row.item.peak_count }}x</span>
          </div>
        </template>
        <template #cell(actions)="row">
          <b-button variant="outline-info" size="sm" @click="showChartHistory(row.item)">
            <font-awesome-icon data-html2canvas-ignore="true" :icon="['fa', 'chart-line']" />
            {{ $t('chart.chart_history') }}
          </b-button>
        </template>
      </b-table>
    </b-modal>

    <!-- Sub-modal for chart history -->
    <b-modal 
      v-model="showHistoryModal" 
      :title="historyModalTitle"
      size="lg"
      :header-bg-variant="theme === 'light' ? 'light' : 'dark'"
      :header-text-variant="theme === 'light' ? 'dark' : 'white'"
      :body-bg-variant="theme === 'light' ? 'white' : 'dark'"
      :body-text-variant="theme === 'light' ? 'dark' : 'white'"
      :footer-bg-variant="theme === 'light' ? 'light' : 'dark'"
      :footer-text-variant="theme === 'light' ? 'dark' : 'white'"
      ok-only>
      <div v-if="chartHistory.length === 0" class="text-center py-4">
        {{ $t('messages.no_chart_history') }}
      </div>
      <b-table
        v-else
        :fields="historyFields"
        :items="chartHistory"
        responsive
        :dark="theme === 'dark'"
        :striped="true"
        :small="true"
        hover>
        <template #cell(week)="row">
          <span class="d-block">{{ row.item.week }}</span>
          <span class="d-block small text-muted">{{ row.item.date }}</span>
        </template>
        <template #cell(rank)="row">
          <span :class="'d-block text-center font-weight-bold ' + (row.item.rank === rank ? 'text-danger' : '')">
            #{{ row.item.rank }}
          </span>
        </template>
        <template #cell(position_change)="row">
          <span v-if="row.item.position_change > 0" class="text-success">
            <font-awesome-icon :icon="['fa', 'arrow-up']" /> +{{ row.item.position_change }}
          </span>
          <span v-else-if="row.item.position_change < 0" class="text-danger">
            <font-awesome-icon :icon="['fa', 'arrow-down']" /> {{ row.item.position_change }}
          </span>
          <span v-else class="text-muted">
            <font-awesome-icon :icon="['fa', 'minus']" /> {{ $t('chart.no_change') }}
          </span>
        </template>
      </b-table>
    </b-modal>
  </div>
</template>

<script lang="ts">
import moment from 'moment';
import {Vue} from 'vue-property-decorator';
import {getArtistsWithMostEntriesInTopX, getUserChartList} from "@/charts/helpers";

export default Vue.extend({
  name: 'MostNumberOnes',
  data() {
    const year = moment().format('YYYY');
    const currentDate = moment();
    return {
      limit: 1,
      rank: 1,
      year: this.$t('word.all_time') + '',
      startYear: year,
      endYear: year,
      loaded: false,
      items: [] as any[],
      rankings: [1],
      tp: 'albums' as 'albums'|'tracks',
      sortBy: 'ranking',
      sortDesc: false,
      currentDate: currentDate,
      showModal: false,
      modalTitle: '',
      modalItems: [] as any[],
      showHistoryModal: false,
      historyModalTitle: '',
      chartHistory: [] as any[],
    };
  },
  computed: {
    user: {
      get(): any {
        return this.$store.getters.getDefaultUser;
      },
      set(newValue: string) {
        this.$store.dispatch('setCurrentUser', newValue);
      },
    },
    startDate(): string {
      return moment(this.$store.getters.getDefaultUser.weeklyCharts.startDate).format('YYYY-MM-DD');
    },
    cardOpen(): { settingsWeek: boolean, updateWeek: boolean, settingsTable: boolean } {
      return this.$store.getters.getCardOpen;
    },
    theme(): string {
      return this.$store.getters.getTheme;
    },
    fields() {
      const item = this.tp === 'albums' ? this.$tc('word.album', 2) : this.$tc('word.track', 2);
      return [
        { key: 'ranking', label: '#', class: 'text-center w-5' },
        { key: 'name_artist', label: this.$tc('word.artist', 1), class: 'title' },
        { key: 'total_items', label: item, class: 'text-center w-5', sortable: true },
        { key: 'total_weeks', label: this.$tc('word.week', 2), class: 'text-center w-5', sortable: true },
        { key: 'actions', label: this.$t('word.actions'), class: 'text-center w-10', sortable: false },
      ];
    },
    modalFields() {
      const itemType = this.tp === 'albums' ? this.$tc('word.album', 1) : this.$tc('word.track', 1);
      return [
        { key: 'name', label: itemType, class: 'title' },
        { key: 'number_ones', label: `#${this.rank} Hits`, class: 'text-center w-5' },
        { key: 'weeks_on_chart', label: this.$t('chart.weeks_on_top_100'), class: 'w-15' },
        { key: 'peak_info', label: this.$t('chart.peak_position'), class: 'text-center w-10' },
        { key: 'actions', label: this.$t('word.actions'), class: 'text-center w-10' },
      ];
    },
    historyFields() {
      return [
        { key: 'week', label: this.$t('word.week'), class: 'title' },
        { key: 'rank', label: this.$t('word.rank'), class: 'text-center w-10' },
        { key: 'position_change', label: this.$t('chart.position_change'), class: 'text-center w-15' },
      ];
    },
    years() {
      const years = [this.$t('word.all_time')];
      for (let i = parseInt(this.endYear, 10); i >= parseInt(this.startYear, 10); i--) {
        years.push(i.toString());
      }
      return years;
    },
  },
  watch: {
    rank(newValue: number) {
      this.loadCharts();
    },
    year(newValue: number) {
      this.loadCharts();
    },
  },
  methods: {
    setRankings() {
      this.rankings = [1];
      for (let i = 2; i <= this.limit; i++) {
        this.rankings.push(i);
      }
    },
    loadCharts() {
      const weeks = getUserChartList(this.user, 'week');
      this.limit = weeks && weeks[0].limit ? weeks[0].limit : 1;
      this.startYear = weeks && weeks[0].start ? moment(weeks[0].start).format('YYYY') : this.endYear;
      this.setRankings();
      if (!this.loaded || this.rank > this.limit) {
        this.loaded = true;
        this.rank = 1;
      }
      if (weeks.length > 0) {
        const type = this.$route.params.type || 'albums';
        this.tp = (type === 'albums' || type === 'tracks') ? type : 'albums';
        this.items = getArtistsWithMostEntriesInTopX(weeks, this.tp, this.rank, this.year);
      }
    },
    async showArtistNumberOnes(artist: any) {
      const weeks = getUserChartList(this.user, 'week');
      const type = this.tp;
      const artistName = artist.name || artist.artist;
      
      if (!artistName) {
        console.error('No artist name found', artist);
        return;
      }
      
      this.modalTitle = `${this.$tc('word.artist', 1)}: ${artistName} - #${this.rank} Hits`;
      
      let filteredWeeks = weeks;
      if (parseInt(this.year, 10) > 0) {
        filteredWeeks = weeks.filter((week: any) => 
          moment(week.start || week.date).format('YYYY') === this.year
        );
      }
      
      const artistItems = new Map();
      const latestWeekDate = filteredWeeks.length > 0 
        ? moment(filteredWeeks[0].start || filteredWeeks[0].date)
        : null;
      
      // First pass: Find all items that hit the target rank
      for (const week of filteredWeeks as any[]) {
        const chart = week[type] || [];
        const weekDate = week.start || week.date;
        const formattedDate = moment(weekDate).format('MMM D, YYYY');
        const isCurrentWeek = latestWeekDate && moment(weekDate).isSame(latestWeekDate, 'week');
        
        for (const entry of chart) {
          const entryArtist = entry.artist || entry.artists;
          if (entryArtist === artistName && entry.rank === this.rank) {
            const itemKey = type === 'albums' ? entry.name : `${entry.name}-${entryArtist}`;
            
            if (!artistItems.has(itemKey)) {
              artistItems.set(itemKey, {
                name: entry.name,
                artist: entryArtist,
                number_ones: 0,
                weeks_on_chart: 0,
                peak_position: entry.rank,
                peak_count: 0,
                first_appearance: formattedDate,
                last_appearance: formattedDate,
                still_charting: isCurrentWeek,
                appearances: new Set(),
                allAppearances: new Set(),
                ranks: [entry.rank],
                rankCounts: new Map(),
              });
            }
            
            const record = artistItems.get(itemKey);
            const weekId = moment(weekDate).format('YYYY-MM-DD');
            
            if (!record.appearances.has(weekId)) {
              record.appearances.add(weekId);
              record.number_ones = record.appearances.size;
              
              // Count peak occurrences
              const peakRank = Math.min(...record.ranks);
              if (entry.rank === peakRank) {
                record.peak_count = (record.peak_count || 0) + 1;
              }
              
              if (moment(weekDate).isBefore(moment(record.first_appearance))) {
                record.first_appearance = formattedDate;
              }
              
              if (moment(weekDate).isAfter(moment(record.last_appearance))) {
                record.last_appearance = formattedDate;
              }
            }
            
            if (isCurrentWeek) {
              record.still_charting = true;
            }
          }
        }
      }
      
      // Second pass: Get full chart history for these items
      for (const week of filteredWeeks as any[]) {
        const chart = week[type] || [];
        const weekDate = week.start || week.date;
        const formattedDate = moment(weekDate).format('MMM D, YYYY');
        const isCurrentWeek = latestWeekDate && moment(weekDate).isSame(latestWeekDate, 'week');
        
        for (const entry of chart) {
          const entryArtist = entry.artist || entry.artists;
          const itemKey = type === 'albums' ? entry.name : `${entry.name}-${entryArtist}`;
          
          if (artistItems.has(itemKey) && entryArtist === artistName) {
            const record = artistItems.get(itemKey);
            const weekId = moment(weekDate).format('YYYY-MM-DD');
            
            if (!record.allAppearances.has(weekId)) {
              record.allAppearances.add(weekId);
              record.weeks_on_chart = record.allAppearances.size;
              
              if (moment(weekDate).isBefore(moment(record.first_appearance))) {
                record.first_appearance = formattedDate;
              }
              
              if (moment(weekDate).isAfter(moment(record.last_appearance))) {
                record.last_appearance = formattedDate;
              }
            }
            
            // Track all ranks for peak calculation
            if (entry.rank) {
              record.ranks.push(entry.rank);
              const previousPeak = record.peak_position;
              const newPeak = Math.min(...record.ranks);
              record.peak_position = newPeak;
              
              // Count occurrences of the peak position
              if (newPeak !== previousPeak) {
                // Reset count if peak changed
                record.peak_count = record.ranks.filter((r: number) => r === newPeak).length;
              } else if (entry.rank === newPeak) {
                record.peak_count = (record.peak_count || 0) + 1;
              }
            }
            
            if (isCurrentWeek) {
              record.still_charting = true;
            }
          }
        }
      }
      
      this.modalItems = Array.from(artistItems.values()).map(item => ({
        name: item.name,
        artist: item.artist,
        number_ones: item.number_ones,
        weeks_on_chart: item.weeks_on_chart || item.number_ones,
        peak_position: item.peak_position,
        peak_count: item.peak_count || 1,
        first_appearance: item.first_appearance,
        last_appearance: item.last_appearance,
        still_charting: item.still_charting
      })).sort((a, b) => b.weeks_on_chart - a.weeks_on_chart);
      
      console.log('Modal items found:', this.modalItems.length);
      this.showModal = true;
    },
    
    async showChartHistory(item: any) {
      const weeks = getUserChartList(this.user, 'week');
      const type = this.tp;
      const artistName = this.modalTitle.split(':')[1]?.trim().split(' -')[0];
      
      this.historyModalTitle = `${item.name} - ${this.$t('chart.chart_history')}`;
      
      let filteredWeeks = weeks;
      if (parseInt(this.year, 10) > 0) {
        filteredWeeks = weeks.filter((week: any) => 
          moment(week.start || week.date).format('YYYY') === this.year
        );
      }
      
      const history: any[] = [];
      let previousRank: number | null = null;
      
      for (const week of filteredWeeks as any[]) {
        const chart = week[type] || [];
        const weekDate = week.start || week.date;
        const weekNumber = moment(weekDate).format('MMM D, YYYY');
        const weekLabel = `Week ${moment(weekDate).format('MMM D')}`;
        
        const entry = chart.find((e: any) => {
          const entryArtist = e.artist || e.artists;
          return e.name === item.name && entryArtist === artistName;
        });
        
        if (entry) {
          const positionChange = previousRank ? previousRank - entry.rank : 0;
          history.push({
            week: weekLabel,
            date: weekDate,
            rank: entry.rank,
            position_change: positionChange,
            raw_date: moment(weekDate)
          });
          previousRank = entry.rank;
        }
      }
      
      history.sort((a, b) => a.raw_date.valueOf() - b.raw_date.valueOf());
      
      // Recalculate position changes after sorting
      for (let i = 0; i < history.length; i++) {
        if (i === 0) {
          history[i].position_change = 0;
        } else {
          history[i].position_change = history[i-1].rank - history[i].rank;
        }
      }
      
      this.chartHistory = history;
      this.showHistoryModal = true;
    }
  },
  mounted() {
    this.loadCharts();
  },
});
</script>

<style>
.smaller {
  font-size: 0.8rem;
}
.weeks-info, .peak-info {
  line-height: 1.3;
}
.font-weight-semibold {
  font-weight: 600;
}
</style>