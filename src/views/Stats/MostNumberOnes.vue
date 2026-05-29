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
              {{ $tc('stats.most_number_xs', rank, { number: rank }) }}
            </b-card-title>
            <b-card-body>
              <b-row>
                <b-col order-sm="1" order-md="1" sm="12" md="4" lg="3">
                  <b-input-group class="mb-2">
                    <b-input-group-prepend>
                      <b-btn href="#" variant="danger">
                        {{ $t('chart.rank') }}:
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
                <b-col order-sm="3" order-md="2" sm="12" md="8" lg="9" class="text-right">
                  <b-button-group class="d-sm-flex d-md-block">
                    <b-button variant="danger" :disabled="tp === 'artists'" :to="{ name: 'weekly.stats.most_number_ones', params: { type: 'artists' } }" @click="loadCharts"><font-awesome-icon data-html2canvas-ignore="true" icon="user" /> {{ $tc("word.artist", 2) }}</b-button>
                    <b-button variant="danger" :disabled="tp === 'albums'" :to="{ name: 'weekly.stats.most_number_ones', params: { type: 'albums' } }" @click="loadCharts"><font-awesome-icon data-html2canvas-ignore="true" :icon="['fa', 'compact-disc']" /> {{ $tc("word.album", 2) }}</b-button>
                    <b-button variant="danger" :disabled="tp === 'tracks'" :to="{ name: 'weekly.stats.most_number_ones', params: { type: 'tracks' } }" @click="loadCharts"><font-awesome-icon data-html2canvas-ignore="true" :icon="['fa', 'music']" /> {{ $tc("word.track", 2) }}</b-button>
                  </b-button-group>
                </b-col>
                <b-col order-sm="2" ordem-md="3" sm="12" md="12" v-if="rank > 1">
                  <b-form-checkbox v-model="peak" name="peak">{{ $tc('stats.include_only_peak_at', rank, { number: rank }) }}</b-form-checkbox>
                </b-col>
              </b-row>
              <b-table
                  :fields="fields"
                  :items="items"
                  :class="'bg-' + theme + ' chart-table mt-4'"
                  responsive="lg"
                  :dark="theme === 'dark'"
                  :striped="true"
                  :small="true">
                <template #cell(times)="row">
                  <span class="d-block text-center font-weight-bold">{{ items[row.index].times }}x</span>
                </template>
                <template #cell(name_artist)="row">
                  <span class="d-block">{{ items[row.index].name }}</span>
                  <span class="d-block sub text-muted small">{{ items[row.index].artist }}</span>
                </template>
                <template #cell(weeks_on_chart)="row">
                  <div class="weeks-info">
                    <span class="d-block font-weight-bold">
                      {{ items[row.index].weeks_on_chart || items[row.index].times || 0 }} 
                      {{ $tc('Weeks', items[row.index].weeks_on_chart || items[row.index].times || 0) }}
                      <span v-if="items[row.index].still_charting" class="text-danger">*</span>
                    </span>
                    <span class="d-block small">
                      <span class="text-muted">{{ $t('chart.peak') }}:</span> 
                      <span class="font-weight-semibold">#{{ items[row.index].peak_position || items[row.index].rank || '—' }}</span>
                    </span>
                    <span v-if="items[row.index].first_appearance" class="d-block small">
                      <span class="text-muted">{{ $t('Debut') }}:</span> 
                      {{ items[row.index].first_appearance }}
                    </span>
                    <span v-if="items[row.index].last_appearance && items[row.index].weeks_on_chart > 1" class="d-block small">
                      <span class="text-muted">{{ $t('Last Charted') }}:</span> 
                      {{ items[row.index].last_appearance }}
                    </span>
                  </div>
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
  </div>
</template>

<script lang="ts">
import moment from 'moment';
import {Vue} from 'vue-property-decorator';
import { getRankListAtRankX, getUserChartList} from "@/charts/helpers";

export default Vue.extend({
  name: 'MostNumberOnes',
  data() {
    const year = moment().format('YYYY');
    const currentDate = moment();
    return {
      limit: 1,
      rank: 1,
      peak: false,
      year: this.$t('word.all_time') + '',
      startYear: year,
      endYear: year,
      items: [] as any[],
      rankings: [1],
      peaks: {} as Record<string, Record<string, any>>,
      tp: '',
      currentDate: currentDate,
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
      return [
        { key: 'times', label: 'X', class: 'text-center w-5' },
        { key: 'name_artist', label: this.$tc('word.title', 1), class: 'title' },
        { key: 'weeks_on_chart', label: this.$t('Weeks on Chart'), class: 'text-center w-20' },
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
    peak(newValue: boolean) {
      if (newValue) {
        this.loadPeaks();
      } else {
        this.loadCharts();
      }
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
    async loadCharts() {
      const weeks = getUserChartList(this.user, 'week');
      this.limit = weeks && weeks[0]?.limit ? weeks[0].limit : 1;
      this.startYear = weeks && weeks[0]?.start ? moment(weeks[0].start).format('YYYY') : this.endYear;
      this.setRankings();
      if (this.rank > this.limit) {
        this.rank = this.limit;
      }
      if (weeks.length > 0) {
        const type = this.$route.params.type || 'artists';
        this.tp = type;
        this.items = getRankListAtRankX(weeks, type, this.rank, this.year);
        
        // Enrich items with weeks on chart (top 100) information
        await this.enrichWithWeeksOnChart(weeks, type);
        
        if (this.peak && this.rank > 1) {
          this.loadPeaks();
        }
      }
    },
    async enrichWithWeeksOnChart(weeks: any[], type: string) {
      // Filter weeks by year if specific year is selected
      let filteredWeeks = weeks;
      if (parseInt(this.year, 10) > 0) {
        filteredWeeks = weeks.filter(week => 
          moment(week.start || week.date).format('YYYY') === this.year
        );
      }

      // Create a map to track each item's chart history
      const chartHistory = new Map();
      const latestWeekDate = filteredWeeks.length > 0 
        ? moment(filteredWeeks[0].start || filteredWeeks[0].date)
        : null;
      
      // Process each week
      for (const week of filteredWeeks) {
        const chart = week[type] || [];
        const weekDate = week.start || week.date;
        const formattedDate = moment(weekDate).format('MMM D, YYYY');
        const isCurrentWeek = latestWeekDate && moment(weekDate).isSame(latestWeekDate, 'week');
        
        // Process each entry in the chart
        for (const entry of chart) {
          // Create a unique key for the item
          const itemKey = type !== 'artists' 
            ? `${entry.name}-${entry.artist}` 
            : entry.name;
          
          if (!chartHistory.has(itemKey)) {
            chartHistory.set(itemKey, {
              name: entry.name,
              artist: entry.artist || '',
              weeks_on_chart: 0,
              peak_position: entry.rank || 100,
              first_appearance: formattedDate,
              last_appearance: formattedDate,
              still_charting: isCurrentWeek,
              appearances: new Set(),
              ranks: []
            });
          }
          
          const record = chartHistory.get(itemKey);
          
          // Add week to appearances (using week identifier to avoid double-counting)
          const weekId = moment(weekDate).format('YYYY-MM-DD');
          if (!record.appearances.has(weekId)) {
            record.appearances.add(weekId);
            record.weeks_on_chart = record.appearances.size;
            
            // Update first appearance
            if (moment(weekDate).isBefore(moment(record.first_appearance))) {
              record.first_appearance = formattedDate;
            }
            
            // Update last appearance
            if (moment(weekDate).isAfter(moment(record.last_appearance))) {
              record.last_appearance = formattedDate;
            }
          }
          
          // Update still charting status
          if (isCurrentWeek) {
            record.still_charting = true;
          }
          
          // Track rank for peak position
          if (entry.rank) {
            record.ranks.push(entry.rank);
            const currentPeak = Math.min(...record.ranks);
            if (currentPeak < record.peak_position) {
              record.peak_position = currentPeak;
            }
          }
        }
      }

      // Enrich the items with chart history data
      for (let i = 0; i < this.items.length; i++) {
        const item = this.items[i];
        const itemKey = type !== 'artists' 
          ? `${item.name}-${item.artist}` 
          : item.name;
        
        const history = chartHistory.get(itemKey);
        
        if (history) {
          this.$set(this.items, i, {
            ...item,
            weeks_on_chart: history.weeks_on_chart || 0,
            peak_position: history.peak_position || (this.rank === 1 ? 1 : null),
            first_appearance: history.first_appearance,
            last_appearance: history.last_appearance,
            still_charting: history.still_charting || false
          });
        } else {
          // If no chart history found, at least show weeks at #1
          this.$set(this.items, i, {
            ...item,
            weeks_on_chart: item.times || 0,
            peak_position: this.rank,
            first_appearance: null,
            last_appearance: null,
            still_charting: false
          });
        }
      }
      
      // Sort by weeks on chart (descending) then by name
      this.items = this.items.sort((a, b) => {
        if (a.weeks_on_chart !== b.weeks_on_chart) {
          return b.weeks_on_chart - a.weeks_on_chart;
        }
        return (a.name || '').localeCompare(b.name || '');
      });
    },
    loadPeaks() {
      const type = this.$route.params.type || 'artists';
      let filtered = [];
      let year = null;
      if (parseInt(this.year, 10) > 0) {
        year = this.year;
      }
      for (let i = 0; i < this.items.length; i++) {
        let ki = this.items[i].name;
        if (type !== 'artists') {
          ki += '-' + this.items[i].artist;
        }
        if (year) {
          ki += '-' + year;
        }
        if (!this.peaks[type]) {
          this.peaks[type] = {};
        }
        if (!this.peaks[type][ki]) {
          this.peaks[type][ki] = this.$store.getters.getStats('week', type, this.items[i].name, this.items[i].artist, year).getCurrentResume().stats.peak;
        }
        if (this.peaks[type][ki] === this.rank) {
          filtered.push(this.items[i]);
        }
      }
      this.items = filtered;
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
.weeks-info {
  line-height: 1.3;
}
.font-weight-semibold {
  font-weight: 600;
}
</style>