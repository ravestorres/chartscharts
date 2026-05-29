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
              {{ $tc('stats.most_top_xs', rank, { number: rank }) }}
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
                    <b-button variant="danger" :disabled="tp === 'artists'" :to="{ name: 'weekly.stats.most_top_xs', params: { type: 'artists' } }" @click="loadCharts"><font-awesome-icon data-html2canvas-ignore="true" icon="user" /> {{ $tc("word.artist", 2) }}</b-button>
                    <b-button variant="danger" :disabled="tp === 'albums'" :to="{ name: 'weekly.stats.most_top_xs', params: { type: 'albums' } }" @click="loadCharts"><font-awesome-icon data-html2canvas-ignore="true" :icon="['fa', 'compact-disc']" /> {{ $tc("word.album", 2) }}</b-button>
                    <b-button variant="danger" :disabled="tp === 'tracks'" :to="{ name: 'weekly.stats.most_top_xs', params: { type: 'tracks' } }" @click="loadCharts"><font-awesome-icon data-html2canvas-ignore="true" :icon="['fa', 'music']" /> {{ $tc("word.track", 2) }}</b-button>
                  </b-button-group>
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
                <template #cell(name_artist)="row">
                  <span class="d-block">{{ row.item.name }}</span>
                  <span class="d-block sub text-muted small">{{ row.item.artist }}</span>
                </template>
                <template #cell(times)="row">
                  <span class="d-block text-center font-weight-bold">{{ row.item.times }}x</span>
                </template>
                <template #cell(peak_info)="row">
                  <div class="text-center">
                    <span class="font-weight-bold text-success">#{{ row.item.peak_position }}</span>
                    <span class="small text-muted d-block">({{ row.item.peak_count }}x)</span>
                  </div>
                </template>
                <template #cell(actions)="row">
                  <b-button size="sm" variant="outline-info" @click="viewChartHistory(row.item)">
                    <font-awesome-icon :icon="['fas', 'chart-line']" />
                    {{ $t('chart.chart_history') }}
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
    
    <!-- Chart History Modal -->
    <b-modal v-model="showChartModal" size="xl" :title="modalTitle" hide-footer scrollable
             :header-bg-variant="theme === 'light' ? 'light' : 'dark'"
             :header-text-variant="theme === 'light' ? 'dark' : 'white'"
             :body-bg-variant="theme === 'light' ? 'white' : 'dark'"
             :body-text-variant="theme === 'light' ? 'dark' : 'white'">
      <div v-if="selectedItem">
        <!-- Summary Stats -->
        <div class="summary-stats mb-4" v-if="selectedItem.chartPositions && selectedItem.chartPositions.length > 0">
          <b-row>
            <b-col md="3" sm="6" class="mb-2">
              <div class="stat-card" :class="'bg-' + theme">
                <div class="stat-value">{{ selectedItem.chartPositions.length }}</div>
                <div class="stat-label">{{ $t('chart.total_weeks_on_chart') }}</div>
              </div>
            </b-col>
            <b-col md="3" sm="6" class="mb-2">
              <div class="stat-card" :class="'bg-' + theme">
                <div class="stat-value">
                  #{{ getPeakPosition() }}
                  <small class="stat-sub">({{ getPeakWeeksCount() }}x)</small>
                </div>
                <div class="stat-label">{{ $t('chart.peak_position') }}</div>
              </div>
            </b-col>
            <b-col md="3" sm="6" class="mb-2">
              <div class="stat-card" :class="'bg-' + theme">
                <div class="stat-value">{{ chartRuns.length }}</div>
                <div class="stat-label">{{ $t('chart.chart_runs') }}</div>
              </div>
            </b-col>
            <b-col md="3" sm="6" class="mb-2">
              <div class="stat-card" :class="'bg-' + theme">
                <div class="stat-value">{{ getAveragePosition() }}</div>
                <div class="stat-label">{{ $t('chart.avg_position') }}</div>
              </div>
            </b-col>
          </b-row>
        </div>
        
        <!-- Chart Runs Grid -->
        <div class="chart-runs-grid mb-4" v-if="chartRuns.length > 0">
          <div class="chart-runs-header">
            <h6>{{ $t('chart.chart_runs_analysis') }}</h6>
            <small class="text-muted">{{ selectedItem.name }} <span v-if="selectedItem.artist">- {{ selectedItem.artist }}</span></small>
          </div>
          <div class="chart-runs-container">
            <div v-for="(run, runIndex) in chartRuns" :key="runIndex" class="chart-run-section"
                 :style="{ backgroundColor: theme === 'dark' ? '#2d2d2d' : 'white' }">
              <div class="run-header">
                <strong>{{ $t('chart.run') }} {{ runIndex + 1 }}</strong>
                <small class="text-muted ml-2">
                  {{ run.length }} {{ $tc('word.weeks', run.length) }} | 
                  {{ formatDateFull(run[0].date) }} - {{ formatDateFull(run[run.length - 1].date) }}
                </small>
                <b-badge v-if="runIndex === 0 && run.length === chartRuns[0].length" variant="success" class="ml-2">
                  {{ $t('chart.initial_run') }}
                </b-badge>
                <b-badge v-else variant="warning" class="ml-2">
                  {{ $t('chart.re_entry') }}
                </b-badge>
                <b-badge variant="info" class="ml-2">
                  {{ $t('chart.peak') }}: #{{ getRunPeakPosition(run) }} ({{ getRunPeakWeeks(run) }}x)
                </b-badge>
              </div>
              <div class="run-grid">
                <div v-for="(entry, entryIndex) in run" :key="entryIndex" 
                     class="chart-entry"
                     :class="{
                       'first-entry': entryIndex === 0 && runIndex === 0,
                       'peak-number-one': entry.position === 1,
                       'drastic-drop': getPositionChange(entry, entryIndex, run) <= -5
                     }"
                     :title="getEntryTooltip(entry, run, entryIndex)">
                  <div class="position" :class="getPositionClass(entry.position, run, entryIndex)">
                    #{{ entry.position }}
                    <span v-if="entry.position === 1" class="peak-star gold-star">★</span>
                    <span v-if="getPositionChange(entry, entryIndex, run) <= -5" class="drop-indicator">▼</span>
                    <span v-if="getPositionChange(entry, entryIndex, run) >= 5" class="rise-indicator">▲</span>
                  </div>
                  <div class="date">{{ formatDateGrid(entry.date) }}</div>
                  <div class="plays">{{ entry.playcount }} {{ $t('word.plays') }}</div>
                  <div v-if="Math.abs(getPositionChange(entry, entryIndex, run)) >= 5" class="change-badge">
                    <span :class="getPositionChange(entry, entryIndex, run) <= -5 ? 'text-danger' : 'text-success'">
                      {{ getPositionChange(entry, entryIndex, run) > 0 ? '+' : '' }}{{ getPositionChange(entry, entryIndex, run) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Detailed Table -->
        <b-table 
          v-if="selectedItem.chartPositions && selectedItem.chartPositions.length > 0"
          :items="selectedItem.chartPositions"
          :fields="chartRunFields"
          responsive="lg"
          :small="true"
          :bordered="true"
          :hover="true"
          :dark="theme === 'dark'"
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
          
          <template #cell(peak_info)="row">
            <div v-if="row.item.position === getPeakPosition()" class="text-center">
              <span class="text-warning font-weight-bold">★</span>
              <span class="small text-muted">({{ getPeakWeeksCount() }}x)</span>
            </div>
            <div v-else class="text-center text-muted">-</div>
          </template>
          
          <template #cell(playcount)="row">
            {{ formatNumber(row.item.playcount) }}
          </template>
          
          <template #cell(type)="row">
            <span v-if="row.index === 0" class="badge badge-success">{{ $t('chart.first_entry') }}</span>
            <span v-else-if="isReEntry(selectedItem.chartPositions, row.index)" 
                  class="badge badge-warning">{{ $t('chart.re_entry') }}</span>
            <span v-else-if="row.item.position_change && row.item.position_change <= -5" 
                  class="badge badge-danger">{{ $t('chart.sharp_drop') }}</span>
            <span v-else class="badge badge-secondary">{{ $t('chart.consecutive') }}</span>
          </template>
        </b-table>
        
        <div v-else class="text-center p-4">
          <p class="text-muted">{{ $t('messages.no_chart_data') }}</p>
        </div>
      </div>
    </b-modal>
  </div>
</template>

<script lang="ts">
import moment from 'moment';
import {Vue} from 'vue-property-decorator';
import { getRankListAtTopX, getUserChartList } from "@/charts/helpers";

export default Vue.extend({
  name: 'MostNumberOnes',
  data() {
    const year = moment().format('YYYY');
    return {
      limit: 1,
      rank: 1,
      year: this.$t('word.all_time') as string,
      startYear: year,
      endYear: year,
      loaded: false,
      items: [] as any[],
      rankings: [1] as number[],
      tp: 'artists' as string,
      
      // Chart history modal
      showChartModal: false,
      selectedItem: null as any,
      chartRuns: [] as any[],
      chartRunFields: [
        { key: 'date', label: this.$t('word.week_ending'), sortable: true },
        { key: 'position', label: this.$t('word.position'), sortable: true, class: 'text-center' },
        { key: 'position_change', label: this.$t('chart.change'), sortable: true, class: 'text-center' },
        { key: 'peak_info', label: this.$t('chart.peak_status'), class: 'text-center' },
        { key: 'playcount', label: this.$t('word.plays'), sortable: true, class: 'text-center' },
        { key: 'type', label: this.$t('word.type'), sortable: false, class: 'text-center' }
      ],
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
        { key: 'ranking', label: '#', class: 'text-center w-5' },
        { key: 'times', label: `#${this.rank} ${this.$tc('word.hits', 2)}`, class: 'text-center w-10' },
        { key: 'name_artist', label: this.$tc('word.title', 1), class: 'title' },
        { key: 'peak_info', label: this.$t('chart.peak_position'), class: 'text-center w-10' },
        { key: 'actions', label: this.$t('word.actions'), class: 'text-center w-10' }
      ];
    },
    years() {
      const years = [this.$t('word.all_time') as string];
      for (let i = parseInt(this.endYear, 10); i >= parseInt(this.startYear, 10); i--) {
        years.push(i.toString());
      }
      return years;
    },
    modalTitle(): string {
      if (!this.selectedItem) return this.$t('chart.chart_history') as string;
      return `${this.$t('chart.chart_history') as string}: ${this.selectedItem.name}`;
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
      this.limit = weeks && weeks[0] && weeks[0].limit ? weeks[0].limit : 1;
      this.startYear = weeks && weeks[0] && weeks[0].start ? moment(weeks[0].start).format('YYYY') : this.endYear;
      this.setRankings();
      if (!this.loaded || this.rank > this.limit) {
        this.loaded = true;
        this.rank = this.limit > 0 ? this.limit : 1;
      }
      if (weeks && weeks.length > 0) {
        const type = this.$route.params.type || 'artists';
        this.tp = type as string;
        const result = getRankListAtTopX(weeks, type, this.rank, this.year);
        
        // Calculate peak position and count for each item
        this.items = result.map((item: any, index: number) => {
          const chartHistory = this.getItemChartHistory(weeks, type, item);
          const { peakPosition, peakCount } = this.calculatePeakInfo(chartHistory);
          
          return {
            ...item,
            ranking: index + 1,
            peak_position: peakPosition,
            peak_count: peakCount
          };
        });
      }
    },
    
    getItemChartHistory(weeks: any[], type: string, item: any): any[] {
      const chartPositions: any[] = [];
      
      let filteredWeeks = weeks;
      if (this.year !== this.$t('word.all_time') && parseInt(this.year, 10) > 0) {
        filteredWeeks = weeks.filter((week: any) => 
          moment(week.start || week.date).format('YYYY') === this.year
        );
      }
      
      for (const week of filteredWeeks) {
        const chart = week[type] || [];
        const weekDate = week.start || week.date;
        
        let foundItem = null;
        if (type === 'artists') {
          foundItem = chart.find((entry: any) => entry.name === item.name);
        } else {
          foundItem = chart.find((entry: any) => 
            entry.name === item.name && entry.artist === item.artist
          );
        }
        
        if (foundItem) {
          chartPositions.push({
            date: weekDate,
            position: foundItem.rank,
            playcount: foundItem.playcount || 0
          });
        }
      }
      
      return chartPositions.sort((a: any, b: any) => moment(a.date).valueOf() - moment(b.date).valueOf());
    },
    
    calculatePeakInfo(chartPositions: any[]): { peakPosition: number, peakCount: number } {
      if (!chartPositions || chartPositions.length === 0) {
        return { peakPosition: this.rank, peakCount: 0 };
      }
      
      const peakPosition = Math.min(...chartPositions.map((p: any) => p.position));
      const peakCount = chartPositions.filter((p: any) => p.position === peakPosition).length;
      
      return { peakPosition, peakCount };
    },
    
    getPositionChange(entry: any, entryIndex: number, run: any[]): number {
      if (entryIndex === 0) return 0;
      const prevEntry = run[entryIndex - 1];
      return prevEntry.position - entry.position;
    },
    
    // Chart history methods
    formatDateFull(dateString: string): string {
      if (!dateString) return '-';
      return moment(dateString).format('MMMM D, YYYY');
    },
    
    formatDateGrid(dateString: string): string {
      if (!dateString) return '-';
      return moment(dateString).format('MMM D');
    },
    
    formatNumber(num: number): string {
      if (!num) return '0';
      return num.toLocaleString();
    },
    
    getAveragePosition(): string {
      if (!this.selectedItem || !this.selectedItem.chartPositions) return '-';
      const positions = this.selectedItem.chartPositions.map((p: any) => p.position);
      const avg = positions.reduce((a: number, b: number) => a + b, 0) / positions.length;
      return avg.toFixed(1);
    },
    
    getPositionClass(position: number, run: any[], entryIndex: number): string {
      const change = this.getPositionChange(run[entryIndex], entryIndex, run);
      
      if (position === 1) return 'position-number-one';
      if (change <= -5) return 'position-drastic-drop';
      if (change >= 5) return 'position-drastic-rise';
      if (position <= 10) return 'position-top-10';
      return 'position-other';
    },
    
    getPeakPosition(): number {
      if (!this.selectedItem || !this.selectedItem.chartPositions) return this.rank;
      const positions = this.selectedItem.chartPositions.map((p: any) => p.position);
      return Math.min(...positions);
    },
    
    getPeakWeeksCount(): number {
      if (!this.selectedItem || !this.selectedItem.chartPositions) return 0;
      const peakPosition = this.getPeakPosition();
      return this.selectedItem.chartPositions.filter((p: any) => p.position === peakPosition).length;
    },
    
    getRunPeakPosition(run: any[]): number {
      const positions = run.map((entry: any) => entry.position);
      return Math.min(...positions);
    },
    
    getRunPeakWeeks(run: any[]): number {
      const peakPosition = this.getRunPeakPosition(run);
      return run.filter((entry: any) => entry.position === peakPosition).length;
    },
    
    isReEntry(chartPositions: any[], index: number): boolean {
      if (index === 0) return false;
      const currentDate = moment(chartPositions[index].date);
      const prevDate = moment(chartPositions[index - 1].date);
      const daysDiff = currentDate.diff(prevDate, 'days');
      return daysDiff > 8;
    },
    
    getEntryTooltip(entry: any, run: any[], entryIndex: number): string {
      const change = this.getPositionChange(entry, entryIndex, run);
      let tooltip = `${this.$t('word.position')}: #${entry.position}\n${this.$t('word.plays')}: ${entry.playcount}\n${this.$t('word.date')}: ${this.formatDateFull(entry.date)}`;
      
      if (entry.position === 1) {
        tooltip += `\n⭐ #1 Peak!`;
      }
      
      if (change <= -5) {
        tooltip += `\n📉 Drastic drop: ${Math.abs(change)} positions`;
      } else if (change >= 5) {
        tooltip += `\n📈 Drastic rise: +${change} positions`;
      }
      
      return tooltip;
    },
    
    async viewChartHistory(item: any) {
      this.selectedItem = item;
      this.showChartModal = true;
      
      try {
        const weeks = getUserChartList(this.user, 'week');
        const type = this.tp;
        
        if (!weeks || weeks.length === 0) {
          this.selectedItem.chartPositions = [];
          this.chartRuns = [];
          return;
        }
        
        let filteredWeeks = weeks;
        if (this.year !== this.$t('word.all_time') && parseInt(this.year, 10) > 0) {
          filteredWeeks = weeks.filter((week: any) => 
            moment(week.start || week.date).format('YYYY') === this.year
          );
        }
        
        const chartPositions: any[] = [];
        
        for (let weekIndex = 0; weekIndex < filteredWeeks.length; weekIndex++) {
          const week = filteredWeeks[weekIndex];
          const chart = week[type] || [];
          const weekDate = week.start || week.date;
          
          let foundItem = null;
          
          if (type === 'artists') {
            foundItem = chart.find((entry: any) => entry.name === item.name);
          } else {
            foundItem = chart.find((entry: any) => 
              entry.name === item.name && entry.artist === item.artist
            );
          }
          
          if (foundItem) {
            chartPositions.push({
              date: weekDate,
              position: foundItem.rank,
              playcount: foundItem.playcount || 0,
              weekIndex: weekIndex
            });
          }
        }
        
        chartPositions.sort((a: any, b: any) => moment(a.date).valueOf() - moment(b.date).valueOf());
        
        // Calculate position changes
        for (let i = 0; i < chartPositions.length; i++) {
          if (i > 0) {
            chartPositions[i].position_change = chartPositions[i-1].position - chartPositions[i].position;
          }
        }
        
        this.selectedItem.chartPositions = chartPositions;
        this.generateChartRuns(chartPositions);
        
      } catch (error) {
        console.error('Error loading chart history:', error);
        this.selectedItem.chartPositions = [];
        this.chartRuns = [];
      }
    },
    
    generateChartRuns(chartPositions: any[]): void {
      if (!chartPositions || chartPositions.length === 0) {
        this.chartRuns = [];
        return;
      }
      
      this.chartRuns = [];
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
            this.chartRuns.push([...currentRun]);
          }
          currentRun = [current];
        }
      }
      
      if (currentRun.length > 0) {
        this.chartRuns.push(currentRun);
      }
    },
  },
  mounted() {
    this.loadCharts();
  },
});
</script>

<style scoped>
.smaller {
  font-size: 0.8rem;
}

/* Chart History Modal Styles */
.chart-runs-grid {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.theme-dark .chart-runs-grid {
  background: #1e1e1e;
}

.chart-runs-header {
  margin-bottom: 15px;
  border-bottom: 2px solid #dee2e6;
  padding-bottom: 10px;
}

.theme-dark .chart-runs-header {
  border-bottom-color: #404040;
}

.chart-runs-header h6 {
  margin-bottom: 5px;
}

.chart-runs-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-run-section {
  border-radius: 6px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: 1px solid #dee2e6;
}

.theme-dark .chart-run-section {
  border-color: #404040;
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

.theme-dark .run-header {
  border-bottom-color: #404040;
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
  cursor: help;
  position: relative;
}

.theme-dark .chart-entry {
  border-color: #404040;
}

.chart-entry:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.chart-entry.first-entry {
  border: 2px solid #28a745;
  background-color: rgba(40, 167, 69, 0.05);
}

.chart-entry.peak-position {
  border: 2px solid #ffc107;
  background-color: rgba(255, 193, 7, 0.1);
  box-shadow: 0 0 5px rgba(255, 193, 7, 0.3);
}

.position {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 5px;
  position: relative;
}

.peak-star {
  color: #ffc107;
  font-size: 0.8rem;
  margin-left: 2px;
}

.position.position-peak {
  color: #ffc107;
  text-shadow: 0 0 2px rgba(0,0,0,0.3);
}

.position.position-1 {
  color: #28a745;
}

.position.position-top-10 {
  color: #007bff;
}

.position.position-other {
  color: #6c757d;
}

.theme-dark .position.position-other {
  color: #adb5bd;
}

.date {
  font-size: 0.85rem;
  color: #495057;
  margin-bottom: 3px;
}

.theme-dark .date {
  color: #adb5bd;
}

.plays {
  font-size: 0.75rem;
  color: #6c757d;
}

.theme-dark .plays {
  color: #8c959f;
}

/* Summary Stats */
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

.theme-dark .stat-card {
  border-color: #404040;
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

.theme-dark .stat-label {
  color: #adb5bd;
}

/* Responsive styles */
@media (max-width: 768px) {
  .run-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
  
  .run-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .run-header small {
    margin-left: 0;
    margin-top: 5px;
  }
}

@media (max-width: 576px) {
  .run-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
  
  .chart-entry {
    padding: 8px 5px;
  }
  
  .position {
    font-size: 1rem;
  }
  
  .date {
    font-size: 0.75rem;
  }
  
  .plays {
    font-size: 0.7rem;
  }
}

/* Table column widths */
.w-5 {
  width: 5%;
}

.w-10 {
  width: 10%;
}

.title {
  width: 65%;
}

/* Dark mode adjustments */
.theme-dark .bg-white,
.theme-dark .bg-light {
  background-color: #2d2d2d !important;
  color: #e0e0e0 !important;
}

.theme-dark .text-muted {
  color: #adb5bd !important;
}
</style>