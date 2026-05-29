<template>
  <b-row>
    <b-col>
      <!-- Centered navigation tabs -->
      <b-row class="justify-content-center">
        <b-col sm="12" md="6" lg="4">
          <b-nav pills fill class="nav-danger mb-2">
            <b-nav-item :active="selected == 'artists'" :to="{ name: 'weekly.artists', params: { week: index + 1 } }" @click="selectArtists"><font-awesome-icon data-html2canvas-ignore="true" icon="user" /> {{ $tc("word.artist", 2) }}</b-nav-item>
            <b-nav-item :active="selected == 'albums'" :to="{ name: 'weekly.albums', params: { week: index + 1 } }" @click="selectAlbums"><font-awesome-icon data-html2canvas-ignore="true" :icon="['fa', 'compact-disc']" /> {{ $tc("word.album", 2) }}</b-nav-item>
            <b-nav-item :active="selected == 'tracks'" :to="{ name: 'weekly.tracks', params: { week: index + 1 } }" @click="selectTracks"><font-awesome-icon data-html2canvas-ignore="true" :icon="['fa', 'music']" /> {{ $tc("word.track", 2) }}</b-nav-item>
          </b-nav>
        </b-col>
      </b-row>
      
      <!-- Date picker row -->
      <b-row class="justify-content-center">
        <b-col sm="12" lg="8" md="8">
          <b-input-group>
            <b-input-group-prepend>
              <b-button variant="danger" :disabled="index === 0" @click="setIndex(0)" :to="{ name: 'weekly.' + type, params: { week: 1 } }">
                <font-awesome-icon :icon="['fa', 'angle-double-left']"/>
              </b-button>
              <b-button variant="danger" :disabled="index === 0" @click="decrement" :to="{ name: 'weekly.' + type, params: { week: index } }">
                <font-awesome-icon :icon="['fa', 'angle-left']"/>
              </b-button>
            </b-input-group-prepend>
            <b-form-input class="border-danger" type="date" @change="setChart" :min="minDate" :max="maxDate" :value="currentDate"></b-form-input>
            <b-input-group-append>
              <b-btn variant="danger" :disabled="index === totalCharts - 1" @click="increment" :to="{ name: 'weekly.' + type, params: { week: index + 2 } }">
                <font-awesome-icon :icon="['fa', 'angle-right']"/>
              </b-btn>
              <b-btn variant="danger" :disabled="index === totalCharts - 1" @click="setIndex(totalCharts - 1)" :to="{ name: 'weekly.' + type, params: { week: totalCharts } }">
                <font-awesome-icon :icon="['fa', 'angle-double-right']"/>
              </b-btn>
            </b-input-group-append>
          </b-input-group>
        </b-col>
      </b-row>
      
      <!-- Centered title -->
      <b-row class="justify-content-center">
        <b-col sm="12" class="text-center mb-2">
          <span class="h5">{{ user.login }}</span>
          <span v-if="totalCharts > 0"> | {{ $tc('word.' + chartType, 1) + ' ' + (index + 1) }}</span>
          <span v-if="totalCharts > 0"> ({{ formattedCurrentDate + ' - ' + formattedCurrentEndDate }})</span>
        </b-col>
      </b-row>
      
      <!-- Main table -->
      <b-table 
        :items="items"
        :fields="fields"
        :class="'bg-' + theme + ' chart-table ' + (this.table.opts.indexOf('separateLine') >= 0 ? '': 'no-line')"
        responsive="lg"
        :dark="theme === 'dark'"
        :small="this.table.opts.indexOf('small') >= 0"
        :bordered="this.table.opts.indexOf('bordered') >= 0"
        :hover="true"
        :striped="this.table.opts.indexOf('striped') >= 0">
        
        <!-- Medal-colored rank cells with icons -->
        <template #cell(rank)="row">
          <span :class="getRankClass(row.item.rank)" class="d-flex align-items-center justify-content-center">
            <font-awesome-icon 
              v-if="row.item.rank === 1" 
              :icon="['fa', 'medal']" 
              class="mr-1 gold-medal"
            />
            <font-awesome-icon 
              v-else-if="row.item.rank === 2" 
              :icon="['fa', 'medal']" 
              class="mr-1 silver-medal"
            />
            <font-awesome-icon 
              v-else-if="row.item.rank === 3" 
              :icon="['fa', 'medal']" 
              class="mr-1 bronze-medal"
            />
            <font-awesome-icon 
              v-else-if="row.item.rank === 4 || row.item.rank === 5" 
              :icon="['fa', 'medal']" 
              class="mr-1 iron-medal"
            />
            {{ row.item.rank }}
          </span>
        </template>
        
        <template #cell(show_details)="row">
          <b-button size="sm" :variant="theme === 'dark' ? 'outline-light border-0': 'outline-dark border-0'" @click.stop="row.toggleDetails" class="p-0 px-1">
            <font-awesome-icon :icon="['fa', 'chevron-up']" v-if="row.detailsShowing"/>
            <font-awesome-icon :icon="['fa', 'chevron-down']" v-if="!row.detailsShowing"/>
          </b-button>
        </template>
        
        <!-- Chart Run Button Column -->
        <template #cell(chart_run)="row">
          <b-button 
            size="sm" 
            :variant="theme === 'dark' ? 'outline-light' : 'outline-dark'" 
            @click.stop="openChartRunModal(row.index)"
            class="p-1 px-2 chart-run-btn"
            title="View Chart Run"
          >
            <font-awesome-icon :icon="['fa', 'chart-line']"/>
          </b-button>
        </template>
        
        <!-- Artist links -->
        <template #cell(name)="row" v-if="selected === 'artists'">
          <b-link @click="viewArtistDetails(row.item.name)" class="artist-link">
            {{ row.item.name }}
          </b-link>
        </template>
        <template #cell(name_artist)="row" v-else>
          <span class="d-block">{{ items[row.index].name }}</span>
          <b-link @click="viewArtistDetails(items[row.index].artist)" class="d-block sub artist-link">
            {{ items[row.index].artist }}
          </b-link>
        </template>
        
        <!-- Separate artist column -->
        <template #cell(artist)="row" v-if="table.opts.indexOf('separateArtist') >= 0 && selected !== 'artists'">
          <b-link @click="viewArtistDetails(row.item.artist)" class="artist-link">
            {{ row.item.artist }}
          </b-link>
        </template>
        
        <!-- Previous rank column with biggest gain / biggest fall labels -->
        <template #cell(previous_rank)="row">
          <span v-if="resumes[row.index].variation[table.previous]" class="d-flex flex-column align-items-center justify-content-center">
            <em v-if="isBiggestGain(row.index)">
              <strong class="text-success"><span v-html="formatter(resumes[row.index].variation[table.previous].rank)"></span>▼</strong>
            </em>
            <em v-else-if="isBiggestFall(row.index)">
              <strong class="text-danger"><span v-html="formatter(resumes[row.index].variation[table.previous].rank)"></span>▲</strong>
            </em>
            <span v-else v-html="formatter(resumes[row.index].variation[table.previous].rank)"></span>
          </span>
        </template>

        <!-- Row details -->
        <template v-slot:row-details="row">
          <b-card :bg-variant="theme === 'light' ? 'white' : 'dark'"
                  :text-variant="theme === 'light' ? 'dark' : 'white'">
            <b-row class="border rounded">
              <b-col cols="12" md="3" class="text-center border-right">
                <b-row class="border-bottom py-2">
                  <b-col>
                    <small class="text-secondary text-uppercase">{{ $t("chart.current_rank") }}</small>
                    <h4 :class="'font-weight-bold pt-2 ' + getRankClass(resumes[row.index].current.rank)">
                      {{ resumes[row.index].current.rank }}
                    </h4>
                  </b-col>
                </b-row>
                <b-row class="border-bottom py-2">
                  <b-col>
                    <small class="text-secondary text-uppercase">{{ $t("chart.previous_rank") }}</small>
                    <h5 class="font-weight-bold pt-2">{{ resumes[row.index].variation.previous.rank }}</h5>
                  </b-col>
                </b-row>
                <b-row class="py-2">
                  <b-col>
                    <small class="text-secondary text-uppercase">{{ $tc("word." + chartType, 2) }}</small>
                    <h5 class="font-weight-bold pt-2">{{ resumes[row.index].total }}</h5>
                  </b-col>
                </b-row>
              </b-col>
              <b-col cols="12" md="9" class="border-left border-on-info">
                <b-row class="border-bottom">
                  <b-col>
                    <h4 class="font-weight-bold pt-1 text-center text-md-left">{{ items[row.index].name }}</h4>
                  </b-col>
                </b-row>
                <b-row class="border-bottom" v-if="items[row.index].artist">
                  <b-col>
                    <h4 class="font-weight-bold pt-1 text-center text-md-left">
                      <b-link @click="viewArtistDetails(items[row.index].artist)" class="artist-link">
                        {{ items[row.index].artist }}
                      </b-link>
                    </h4>
                  </b-col>
                </b-row>
                <b-row class="border-bottom">
                  <b-col cols="4" md="3" lg="2" class="my-auto py-2 text-center font-weight-bold">
                    {{ resumes[row.index].stats.peak }}
                  </b-col>
                  <b-col class="my-auto">
                    {{ $t("chart.peak") }}
                  </b-col>
                </b-row>
                <b-row class="border-bottom">
                  <b-col cols="4" md="3" lg="2" class="my-auto py-2 text-center font-weight-bold">
                    {{ resumes[row.index].debut.rank }}
                  </b-col>
                  <b-col class="my-auto">
                    {{ $t("chart.debut") }}
                  </b-col>
                </b-row>
                <b-row class="border-bottom">
                  <b-col cols="4" md="3" lg="2" class="my-auto py-2 text-center font-weight-bold">
                    {{ resumes[row.index].stats.points }}
                  </b-col>
                  <b-col class="my-auto">
                    {{ $t("chart.chart_points") }}
                  </b-col>
                </b-row>
                <b-row class="border-bottom">
                  <b-col cols="4" md="3" lg="2" class="my-auto py-2 text-center font-weight-bold">
                    {{ resumes[row.index].stats.playcount_sum }}
                  </b-col>
                  <b-col class="my-auto">
                    {{ $t("chart.total_playcount") }}
                  </b-col>
                </b-row>
              </b-col>
            </b-row>
            
            <!-- View Chart Run Button -->
            <b-row class="mt-3">
              <b-col class="text-center">
                <b-button 
                  variant="primary" 
                  @click="openChartRunModal(row.index)"
                  size="sm"
                  class="mt-2"
                  style="background-color: #87CEEB; border-color: #87CEEB;"
                >
                  <font-awesome-icon :icon="['fa', 'chart-line']" class="mr-2"/>
                  {{ $t('chart.view_full_chart_run') }}
                </b-button>
              </b-col>
            </b-row>
          </b-card>
        </template>
        
        <template #cell(on_chart)="row">
          <span class="d-flex align-items-center justify-content-center">
            {{ resumes[row.index].total }}
          </span>
        </template>
        
        <!-- Medal-colored peak cells -->
        <template #cell(peak)="row">
          <span :class="getRankClass(resumes[row.index].stats.peak)" 
                class="d-flex align-items-center justify-content-center"
                v-html="peakFormatter(resumes[row.index].stats.peak, resumes[row.index].stats.peak_times)"></span>
        </template>
        
        <template #cell(previous_playcount)="row">
          <span class="d-flex align-items-center justify-content-center">
            <span v-if="resumes[row.index].variation[table.previous]" v-html="formatter(resumes[row.index].variation[table.previous].playcount, '%')"></span>
          </span>
        </template>

        <!-- Plays (CP) column centered -->
        <template #cell(playcount)="row">
          <span class="d-flex align-items-center justify-content-center">
            {{ row.item.playcount }}
          </span>
        </template>
      </b-table>
      
      <!-- Dropout Chart Section -->
      <div v-if="dropouts.length > 0 && index > 0" class="mt-4">
        <b-card :bg-variant="theme === 'light' ? 'light' : 'dark'"
                :text-variant="theme === 'light' ? 'dark' : 'light'"
                class="dropout-card">
          <template #header>
            <h5 class="mb-0">
              <font-awesome-icon :icon="['fa', 'sign-out-alt']" class="mr-2"/>
              Dropout Chart - Week {{ index }} (Last Week's Entries Not Charting This Week)
            </h5>
          </template>
          
          <b-row>
            <b-col sm="12" class="mb-3">
              <p class="text-muted small mb-2">
                These {{ selected }} charted in Week {{ index }} but are not in Week {{ index + 1 }}
              </p>
            </b-col>
          </b-row>
          
          <div class="dropout-grid">
            <div v-for="(dropout, idx) in dropouts" :key="idx" class="dropout-item">
              <div class="dropout-rank">
                <span class="rank-badge">{{ dropout.rank }}</span>
              </div>
              <div class="dropout-content">
                <div class="dropout-name">
                  <strong>{{ dropout.name }}</strong>
                  <!-- Clickable artist link for non-artist dropouts -->
                  <span v-if="dropout.artist && selected !== 'artists'" class="dropout-artist">
                    <font-awesome-icon :icon="['fa', 'user']" class="mr-1"/>
                    <b-link @click="viewArtistDetails(dropout.artist)" class="artist-link">
                      {{ dropout.artist }}
                    </b-link>
                  </span>
                  <!-- For artist dropouts, make the name clickable -->
                  <span v-if="selected === 'artists'" class="dropout-artist">
                    <font-awesome-icon :icon="['fa', 'user']" class="mr-1"/>
                    <b-link @click="viewArtistDetails(dropout.name)" class="artist-link">
                      {{ dropout.name }}
                    </b-link>
                  </span>
                </div>
                <div class="dropout-stats">
                  <span class="stat-item">
                    <font-awesome-icon :icon="['fa', 'play']" class="mr-1"/>
                    {{ dropout.playcount }} plays
                  </span>
                  <span class="stat-item">
                    <font-awesome-icon :icon="['fa', 'clock']" class="mr-1"/>
                    {{ getDropoutWeeks(idx) }} week{{ getDropoutWeeks(idx) !== 1 ? 's' : '' }}
                  </span>
                  <span v-if="getDropoutPeak(idx)" class="stat-item">
                    <font-awesome-icon :icon="['fa', 'crown']" class="mr-1"/>
                    Peak: #{{ getDropoutPeak(idx) }}
                  </span>
                </div>
              </div>
              <div class="dropout-action">
                <b-button 
                  size="sm" 
                  variant="outline-secondary"
                  @click="openDropoutChartRun(idx)"
                  title="View Chart Run"
                >
                  <font-awesome-icon :icon="['fa', 'history']"/>
                </b-button>
              </div>
            </div>
          </div>
        </b-card>
      </div>
      
      <!-- Legend -->
      <b-row class="justify-content-center mt-4">
        <b-col class="small-legend text-center">
          <span><strong>RANK</strong> {{ $t("chart.current_rank") }}</span>
          <span v-if="this.table.opts.indexOf('previousRank') >= 0"> | <strong>—</strong> {{ $t("chart.previous_rank") }} (<em><strong class="text-success">▲ Best Rise</strong></em> / <em><strong class="text-danger">▼ Worst Drop</strong></em>)</span>
          <span v-if="this.table.opts.indexOf('peak') >= 0"> | <strong>PEAK</strong> {{ $t("chart.peak") }}</span>
          <span> | <strong>PLAYS</strong> {{ $t("chart.current_playcount") }}</span>
          <span v-if="this.table.opts.indexOf('previousPlaycount') >= 0"> | <strong>{{ $t("chart.abbr.pp") }}</strong> {{ $t("chart.previous_playcount") }}</span>
          <span v-if="this.table.opts.indexOf('onChart') >= 0"> | <strong>WEEKS</strong> {{ $t("chart.total_" + chartType) }}</span>
          <br/>
          <span><strong>{{ $t("chart.abbr.re") }}</strong> {{ $t("chart.re_entry") }} | </span>
          <span><strong>{{ $t("chart.abbr.ne") }}</strong> {{ $t("chart.new_entry") }} | </span>
          <span><strong>=</strong> {{ $t("chart.no_variation") }}</span>
          <br/>
          <span><strong class="rank-gold">1st</strong> Gold | </span>
          <span><strong class="rank-silver">2nd</strong> Silver | </span>
          <span><strong class="rank-bronze">3rd</strong> Bronze | </span>
          <span><strong class="rank-iron">4th-5th</strong> Iron</span>
          <br/>
          <UntieModal :user="user" :id="index" :chart="chartType" :type="selected"></UntieModal>
        </b-col>
      </b-row>
      
      <!-- Chart Run Modal - Small Grid Style -->
      <b-modal 
        v-model="chartRunModal.show" 
        :title="chartRunModal.title"
        size="lg"
        centered
        scrollable
        :header-bg-variant="theme === 'light' ? 'light' : 'dark'"
        :header-text-variant="theme === 'light' ? 'dark' : 'light'"
        :body-bg-variant="theme === 'light' ? 'white' : 'dark'"
        :body-text-variant="theme === 'light' ? 'dark' : 'light'"
        :footer-bg-variant="theme === 'light' ? 'light' : 'dark'"
        :footer-text-variant="theme === 'light' ? 'dark' : 'light'"
        hide-footer
      >
        <div v-if="chartRunModal.data">
          <!-- Header Info -->
          <div class="chart-run-header mb-3">
            <h5 class="text-center">{{ chartRunModal.data.name }}</h5>
            <div v-if="chartRunModal.data.artist" class="text-center text-muted small mb-2">
              <b-link @click="viewArtistDetails(chartRunModal.data.artist)" class="artist-link">
                by {{ chartRunModal.data.artist }}
              </b-link>
            </div>
            
            <!-- Stats Grid -->
            <div class="compact-stats-grid">
              <div class="compact-stat">
                <div class="compact-stat-label">Current</div>
                <div :class="'compact-stat-value ' + getRankClass(chartRunModal.data.currentRank)">
                  #{{ chartRunModal.data.currentRank }}
                </div>
              </div>
              <div class="compact-stat">
                <div class="compact-stat-label">Peak</div>
                <div :class="'compact-stat-value ' + getRankClass(chartRunModal.data.peak)">
                  #{{ chartRunModal.data.peak }}
                </div>
              </div>
              <div class="compact-stat">
                <div class="compact-stat-label">Debut</div>
                <div class="compact-stat-value">#{{ chartRunModal.data.debutPosition }}</div>
              </div>
              <div class="compact-stat">
                <div class="compact-stat-label">Weeks</div>
                <div class="compact-stat-value">{{ chartRunModal.data.totalWeeks }}</div>
              </div>
            </div>
          </div>
          
          <!-- Chart Runs Grid - Small Compact -->
          <div class="compact-chart-runs">
            <div 
              v-for="(run, runIndex) in chartRunModal.data.runs" 
              :key="'run-' + runIndex"
              class="compact-run"
            >
              <!-- Run Header -->
              <div class="compact-run-header">
                <h6 class="compact-run-title">Run {{ runIndex + 1 }}</h6>
                <div class="compact-run-dates">
                  {{ formatDateLong(run[0].chart.start) }} - {{ formatDateLong(run[run.length - 1].chart.end) }}
                  <span class="compact-run-weeks">({{ run.length }} week{{ run.length > 1 ? 's' : '' }})</span>
                </div>
              </div>
              
              <!-- Run Weeks Small Grid -->
              <div class="compact-weeks-grid">
                <div 
                  v-for="(entry, weekIndex) in run" 
                  :key="'week-' + runIndex + '-' + weekIndex"
                  class="compact-week-item"
                  :class="{
                    'current-week': entry.chart.index === chartRunModal.data.currentWeekIndex,
                    'peak-week': entry.rank === chartRunModal.data.peak,
                    'debut-week': runIndex === 0 && weekIndex === 0
                  }"
                  @click="goToChartWeek(entry.chart.index)"
                >
                  <div class="compact-week-header">
                    <div class="compact-week-number">Week #{{ entry.chart.index + 1 }}</div>
                    <div class="compact-week-date">{{ formatDateLong(entry.chart.start) }}</div>
                  </div>
                  
                  <div class="compact-week-content">
                    <div class="compact-week-rank">
                      <span :class="'compact-rank-badge ' + getRankClass(entry.rank)">
                        {{ formatRank(entry.rank) }}
                      </span>
                    </div>
                    
                    <div class="compact-week-plays">
                      <font-awesome-icon :icon="['fa', 'play']" class="mr-1"/>
                      {{ entry.playcount }}
                    </div>
                    
                    <!-- Trend Arrow -->
                    <div v-if="weekIndex > 0" class="compact-week-trend">
                      <font-awesome-icon 
                        :icon="['fa', getTrendIcon(entry.rank, run[weekIndex - 1].rank)]"
                        :class="getTrendClass(entry.rank, run[weekIndex - 1].rank)"
                        size="xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Run Separator (except for last run) -->
              <div v-if="runIndex < chartRunModal.data.runs.length - 1" class="compact-run-separator">
                <div class="compact-separator-text">
                  <font-awesome-icon :icon="['fa', 'redo']" class="mr-1"/>
                  Re-entry
                  <font-awesome-icon :icon="['fa', 'redo']" class="ml-1"/>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Summary -->
          <div class="compact-summary mt-3">
            <div class="compact-summary-grid">
              <div class="compact-summary-item">
                <div class="compact-summary-label">Best</div>
                <div :class="'compact-summary-value ' + getRankClass(chartRunModal.data.peak)">
                  #{{ chartRunModal.data.peak }}
                </div>
              </div>
              <div class="compact-summary-item">
                <div class="compact-summary-label">Avg</div>
                <div class="compact-summary-value">#{{ chartRunModal.data.averagePosition }}</div>
              </div>
              <div class="compact-summary-item">
                <div class="compact-summary-label">Total Plays</div>
                <div class="compact-summary-value">{{ chartRunModal.data.totalPlaycount }}</div>
              </div>
              <div class="compact-summary-item">
                <div class="compact-summary-label">Chart Points</div>
                <div class="compact-summary-value">{{ chartRunModal.data.chartPoints }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <template #modal-footer>
          <b-button variant="secondary" @click="chartRunModal.show = false">
            {{ $t('common.close') }}
          </b-button>
          <b-button 
            variant="primary" 
            v-if="chartRunModal.data"
            @click="goToChartWeek(chartRunModal.data.currentWeekIndex)"
            style="background-color: #87CEEB; border-color: #87CEEB;"
          >
            <font-awesome-icon :icon="['fa', 'external-link-alt']" class="mr-2"/>
            Go to Week {{ chartRunModal.data.currentWeekIndex + 1 }}
          </b-button>
        </template>
      </b-modal>
    </b-col>
  </b-row>
</template>

<script lang="ts">
import * as _ from 'lodash';
import LastFm from '@/lastfm';
import { User, fixedStartDate, Stats } from '@/charts';
import { mapGetters } from 'vuex';
import { Component, Prop, Vue } from 'vue-property-decorator';
import moment from 'moment';
import 'moment-timezone';
import {getUserChart, getUserChartList, getUserChartLength, getDropouts} from '@/charts/helpers';
import UntieModal from "@/components/UntieModal.vue";

let chartStats: any = {};

// Define interface for chart run modal data
interface ChartRunModalData {
  runs: any[];
  peak: number;
  peakTimes: number;
  totalWeeks: number;
  currentRank: number;
  averagePosition: number;
  debutPosition: number;
  totalPlaycount: number;
  chartPoints: number;
  name: string;
  artist?: string;
  currentWeekIndex: number;
}

interface ChartRunModalState {
  show: boolean;
  title: string;
  data: ChartRunModalData | null;
}

export default Vue.extend({
  name: 'ChartTable',
  props: {
    user: Object,
    loading: Boolean,
    chartType: String,
    theme: String,
    type: String,
  },
  components: {
    UntieModal,
  },
  computed: {
    items(): any[] {
      if (typeof getUserChartList(this.user, this.chartType)[this.index] !== 'undefined') {
        return getUserChartList(this.user, this.chartType)[this.index][this.selected];
      }
      return [];
    },
    dropouts(): any[] {
      if (this.table.opts.indexOf('dropouts') >= 0 && typeof getUserChartList(this.user, this.chartType)[this.index - 1] !== 'undefined') {
        let previous =  getUserChartList(this.user, this.chartType)[this.index - 1][this.selected];
        let current = getUserChartList(this.user, this.chartType)[this.index][this.selected];
        return getDropouts(this.chartType, this.selected, previous, current);
      }
      return [];
    },
    resumes(): any[] {
      const resumes: any = [];
      for (let i = 0; i < this.items.length; i++) {
        resumes[i] = this.stats(i).getCurrentResume();
      }
      return resumes;
    },
    dropoutsResumes(): any[] {
      const dropoutsResumes: any = [];
      if (this.table.opts.indexOf('dropouts') >= 0) {
        for (let i = 0; i < this.dropouts.length; i++) {
          dropoutsResumes[i] = this.dropoutsStats(i).getCurrentResume();
        }
      }
      return dropoutsResumes;
    },
    fields(): object[] {
      const fields = [];
      let i = 0;

      // CR → RANK
      fields[i] = { key: 'rank', label: 'RANK', class: 'text-center' };
      i++;

      // PR → blank label (data + gain/fall logic kept via cell template)
      if (this.table.opts.indexOf('previousRank') >= 0) {
        fields[i] = { key: 'previous_rank', label: '', class: 'text-center' };
        i++;
      }

      // PK → PEAK
      if (this.table.opts.indexOf('peak') >= 0) {
        fields[i] = { key: 'peak', label: 'PEAK', class: 'text-center px-0' };
        i++;
      }

      // TO → WEEKS
      if (this.table.opts.indexOf('onChart') >= 0) {
        fields[i] = { key: 'on_chart', label: 'WEEKS', class: 'text-center' };
        i++;
      }

      if (this.selected === 'artists') {
        fields[i] = { key: 'name', label: this.$tc('word.artist', 1), class: 'text-center w-60 title' };
      } else {
        if (this.table.opts.indexOf('separateArtist') >= 0) {
          fields[i] = { key: 'name', label: this.$t('word.title'), class: 'text-center w-40 title min-' + this.selected };
          i++;
          fields[i] = { key: 'artist', label: this.$tc('word.artist'), class: 'text-center w-20 min-artists' };
        } else {
          fields[i] = { key: 'name_artist', label: this.$t('word.title_artist'),
          class: 'text-center w-60 title title-both min-artists' };
        }
      }
      i++;

      // CP → PLAYS
      fields[i] = { key: 'playcount', label: 'PLAYS', class: 'text-center' };
      i++;

      if (this.table.opts.indexOf('previousPlaycount') >= 0) {
        fields[i] = { key: 'previous_playcount', label: this.$t('chart.abbr.pp'), class: 'text-center' };
        i++;
      }

      fields[i] = { key: 'chart_run', label: 'Run', class: 'text-center' };
      i++;
      return fields;
    },
    dropoutsFields(): object[] {
      const fields = [];
      let i = 0;

      // PR → blank label in dropouts too
      fields[i] = { key: 'rank', label: '', class: 'text-center' };
      i++;

      // PK → PEAK
      if (this.table.opts.indexOf('peak') >= 0) {
        fields[i] = { key: 'peak', label: 'PEAK', class: 'text-center px-0' };
        i++;
      }

      // TO → WEEKS
      if (this.table.opts.indexOf('onChart') >= 0) {
        fields[i] = { key: 'on_chart', label: 'WEEKS', class: 'text-center' };
        i++;
      }

      if (this.selected === 'artists') {
        fields[i] = { key: 'name', label: this.$tc('word.artist', 1), class: 'text-center w-60 title' };
      } else {
        if (this.table.opts.indexOf('separateArtist') >= 0) {
          fields[i] = { key: 'name', label: this.$t('word.title'), class: 'text-center w-40 title min-' + this.selected };
          i++;
          fields[i] = { key: 'artist', label: this.$tc('word.artist'), class: 'text-center w-20 min-artists' };
        } else {
          fields[i] = { key: 'name_artist', label: this.$t('word.title_artist'),
            class: 'text-center w-60 title title-both min-artists' };
        }
      }
      i++;

      // PP label kept as-is for dropouts (it shows previous playcount)
      fields[i] = { key: 'playcount', label: this.$t('chart.abbr.pp'), class: 'text-center' };
      i++;

      fields[i] = { key: 'chart_run', label: 'Run', class: 'text-center' };
      i++;
      fields[i] = { key: 'show_details', label: '', class: 'text-center' };
      return fields;
    },
    currentDate(): string {
      if (typeof getUserChartList(this.user, this.chartType)[this.index] !== 'undefined') {
        return moment(getUserChartList(this.user, this.chartType)[this.index].start).format('YYYY-MM-DD');
      }
      return '';
    },
    currentEndDate(): string {
      if (typeof getUserChartList(this.user, this.chartType)[this.index] !== 'undefined') {
        return moment(getUserChartList(this.user, this.chartType)[this.index].end)
          .subtract(1, 'days').format('YYYY-MM-DD');
      }
      return '';
    },
    formattedCurrentDate(): string {
      if (typeof getUserChartList(this.user, this.chartType)[this.index] !== 'undefined') {
        return moment(getUserChartList(this.user, this.chartType)[this.index].start).format('MM/DD/YYYY');
      }
      return '';
    },
    formattedCurrentEndDate(): string {
      if (typeof getUserChartList(this.user, this.chartType)[this.index] !== 'undefined') {
        return moment(getUserChartList(this.user, this.chartType)[this.index].end)
          .subtract(1, 'days').format('MM/DD/YYYY');
      }
      return '';
    },
    maxDate(): string {
      const l = getUserChartLength(this.user, this.chartType) - 1;
      if (typeof getUserChartList(this.user, this.chartType)[l] !== 'undefined') {
        return moment(getUserChartList(this.user, this.chartType)[l].start).format('YYYY-MM-DD');
      }
      return '';
    },
    minDate(): string {
      if (typeof getUserChartList(this.user, this.chartType)[0] !== 'undefined') {
        return moment(getUserChartList(this.user, this.chartType)[0].start).format('YYYY-MM-DD');
      }
      return '';
    },
    totalCharts(): number {
      return getUserChartLength(this.user, this.chartType);
    },
    table(): any {
      return this.$store.getters.getTable;
    },
  },
  methods: {
    increment() {
      this.setIndex(this.index + 1);
    },
    decrement() {
      this.setIndex(this.index - 1);
    },
    setIndex(index: number, scroll: boolean = false) {
      if (index >= 0 && index < getUserChartLength(this.user, this.chartType)) {
        this.index = index;
        if (scroll) {
          // @ts-ignore
          this.$scrollTo('#chart');
        }
      }
    },
    setChart(newValue: string) {
      const m = moment(newValue);
      m.tz(this.user.timezone);
      const date = fixedStartDate(m.toDate(), getUserChart(this.user, this.chartType).startDay);
      const found = getUserChartList(this.user, this.chartType)
          .findIndex((chart: any) => date >= chart.start && date < chart.end);
      this.setIndex(found);
      this.$router.push({ name: 'weekly.' + this.type, params: { week: String(found + 1) } });
    },
    selectArtists() {
      this.selected = 'artists';
    },
    selectAlbums() {
      this.selected = 'albums';
    },
    selectTracks() {
      this.selected = 'tracks';
    },
    getStats(type: string, name: string, artist: string|null = null): Stats {
      if (this.loading) {
        chartStats = [];
        return this.$store.getters.getStats(this.chartType, type, name, artist);
      }
      if (typeof chartStats[this.user.login] === 'undefined') {
        chartStats[this.user.login] = { artists: {}, albums: {}, tracks: {} };
      }
      if (type === 'artists') {
        if (typeof chartStats[this.user.login][type][name] === 'undefined') {
          chartStats[this.user.login][type][name] = this.$store.getters.getStats(this.chartType, type, name, artist);
        }
        return chartStats[this.user.login][type][name];
      } else {
        if (typeof chartStats[this.user.login][type][(artist as string)] === 'undefined') {
          chartStats[this.user.login][type][(artist as string)] = {};
        }
        if (typeof chartStats[this.user.login][type][(artist as string)][name] === 'undefined') {
          chartStats[this.user.login][type][(artist as string)][name] =
            this.$store.getters.getStats(this.chartType, type, name, artist);
        }
        return chartStats[this.user.login][type][(artist as string)][name];
      }
    },
    stats(i: number): any {
      return this.getStats(this.selected, this.items[i].name, this.items[i].artist).until(this.index);
    },
    dropoutsStats(i: number): any {
      return this.getStats(this.selected, this.dropouts[i].name, this.dropouts[i].artist).until(this.index);
    },
    formatter(value: number|string, suffix: string = ''): any {
      const prefix = this.table.opts.indexOf('colored') >= 0 ? 'text-' : '';
      if (value === 0) {
        return '=';
      } else if (value === 'RE') {
        return '<span class="' + prefix + 'warning">' + this.$t('chart.abbr.re') + '</span>';
      } else if (value === 'NEW') {
        return '<span class="' + prefix + 'primary">' + this.$t('chart.abbr.ne') + '</span>';
      } else {
        if (this.table.previous !== 'previous') {
          suffix = this.table.previous === 'percent' ? suffix : '';
          if (Number(value) > 0) {
            return '<span class="' + prefix + 'success">+' + value + suffix + '</span>';
          } else {
            return '<span class="' + prefix + 'danger">' + value + suffix + '</span>';
          }
        }
      }
      return value;
    },
    peakFormatter(value: number, times: number): any {
      const prefix = this.table.opts.indexOf('colored') >= 0 ? 'text-' : '';
      const suffix = this.table.opts.indexOf('times') >= 0 ? ' <small class="text-secondary">' + times +
        'x</small>' : '';
      
      // Add medal icons
      let medalIcon = '';
      if (value === 1) {
        medalIcon = '<font-awesome-icon icon="medal" class="mr-1 gold-medal" />';
        return '<span class="' + prefix + 'primary d-flex align-items-center justify-content-center">' + medalIcon + value + suffix + '</span>';
      } else if (value === 2) {
        medalIcon = '<font-awesome-icon icon="medal" class="mr-1 silver-medal" />';
        return '<span class="d-flex align-items-center justify-content-center">' + medalIcon + value + suffix + '</span>';
      } else if (value === 3) {
        medalIcon = '<font-awesome-icon icon="medal" class="mr-1 bronze-medal" />';
        return '<span class="d-flex align-items-center justify-content-center">' + medalIcon + value + suffix + '</span>';
      } else if (value === 4 || value === 5) {
        medalIcon = '<font-awesome-icon icon="medal" class="mr-1 iron-medal" />';
        return '<span class="d-flex align-items-center justify-content-center">' + medalIcon + value + suffix + '</span>';
      }
      
      return value;
    },
    dateFormatter(value: string): string {
      return moment(value).format('MM/DD/YYYY');
    },
    formatDateMMDDYYYY(value: string): string {
      return moment(value).format('MM/DD/YYYY');
    },
    formatDateLong(value: string): string {
      return moment(value).format('MMM DD, YYYY');
    },
    viewArtistDetails(artistName: string) {
      if (this.$route.name === 'artist.detail') {
        this.$router.replace({
          name: 'artist.detail',
          params: { artistName: encodeURIComponent(artistName) }
        });
      } else {
        this.$router.push({
          name: 'artist.detail',
          params: { artistName: encodeURIComponent(artistName) }
        });
      }
    },
    calculateAveragePosition(runs: any[]): number {
      const allEntries = this.flattenRuns(runs);
      const numericEntries = allEntries.filter((entry: any) => 
        typeof entry.rank === 'number' && !isNaN(entry.rank)
      );
      if (numericEntries.length === 0) return 0;
      const sum = numericEntries.reduce((acc: number, entry: any) => acc + entry.rank, 0);
      return Math.round(sum / numericEntries.length);
    },
    flattenRuns(runs: any[]): any[] {
      return runs.flat();
    },
    calculateTotalPlaycount(runs: any[]): number {
      const allEntries = this.flattenRuns(runs);
      return allEntries.reduce((acc: number, entry: any) => acc + (entry.playcount || 0), 0);
    },
    getRankClass(rank: any): string {
      if (rank === 1) return 'rank-gold';
      if (rank === 2) return 'rank-silver';
      if (rank === 3) return 'rank-bronze';
      if (rank === 4 || rank === 5) return 'rank-iron';
      if (rank === 'NEW') return 'rank-new';
      if (rank === 'RE') return 'rank-re';
      return '';
    },
    formatRank(rank: any): string {
      if (rank === 'NEW') return 'NEW';
      if (rank === 'RE') return 'RE';
      return '#' + rank;
    },
    getTrendIcon(currentRank: any, previousRank: any): string {
      if (currentRank === 'NEW' || currentRank === 'RE' || previousRank === 'NEW' || previousRank === 'RE') {
        return 'minus';
      }
      if (typeof currentRank === 'number' && typeof previousRank === 'number') {
        if (currentRank < previousRank) return 'arrow-up';
        if (currentRank > previousRank) return 'arrow-down';
        return 'minus';
      }
      return 'minus';
    },
    getTrendClass(currentRank: any, previousRank: any): string {
      if (currentRank === 'NEW' || currentRank === 'RE' || previousRank === 'NEW' || previousRank === 'RE') {
        return 'text-muted';
      }
      if (typeof currentRank === 'number' && typeof previousRank === 'number') {
        if (currentRank < previousRank) return 'text-success';
        if (currentRank > previousRank) return 'text-danger';
        return 'text-muted';
      }
      return 'text-muted';
    },
    getTrendText(currentRank: any, previousRank: any): string {
      if (currentRank === 'NEW' || currentRank === 'RE' || previousRank === 'NEW' || previousRank === 'RE') {
        return '';
      }
      if (typeof currentRank === 'number' && typeof previousRank === 'number') {
        const diff = previousRank - currentRank;
        if (diff > 0) return `+${diff}`;
        if (diff < 0) return `${diff}`;
        return '=';
      }
      return '';
    },
    getDropoutWeeks(idx: number): number {
      if (this.dropoutsResumes[idx]) {
        return this.dropoutsResumes[idx].total || 0;
      }
      return 0;
    },
    getDropoutPeak(idx: number): number {
      if (this.dropoutsResumes[idx]) {
        return this.dropoutsResumes[idx].stats?.peak || 0;
      }
      return 0;
    },

    // ── Biggest Gain / Biggest Fall ──────────────────────────────────────────
    // Returns the numeric variation rank for an item, or null if not applicable.
    _getVariationRank(idx: number): number | null {
      const v = this.resumes[idx]?.variation?.[this.table.previous];
      if (!v || typeof v.rank !== 'number') return null;
      return v.rank;
    },

    // Biggest Gain: the item whose rank variation is the most negative (moved up most).
    // A rank of -5 means it climbed 5 positions → biggest gain.
    isBiggestGain(idx: number): boolean {
      const rank = this._getVariationRank(idx);
      if (rank === null || rank >= 0) return false; // must have moved up (negative value)
      let bestGain = 0;
      for (let i = 0; i < this.items.length; i++) {
        const r = this._getVariationRank(i);
        if (r !== null && r < 0 && Math.abs(r) > bestGain) {
          bestGain = Math.abs(r);
        }
      }
      return bestGain > 0 && Math.abs(rank) === bestGain;
    },

    // Biggest Fall: the item whose rank variation is the most positive (fell most).
    // A rank of +6 means it dropped 6 positions → biggest fall.
    isBiggestFall(idx: number): boolean {
      const rank = this._getVariationRank(idx);
      if (rank === null || rank <= 0) return false; // must have fallen (positive value)
      let worstFall = 0;
      for (let i = 0; i < this.items.length; i++) {
        const r = this._getVariationRank(i);
        if (r !== null && r > 0 && r > worstFall) {
          worstFall = r;
        }
      }
      return worstFall > 0 && rank === worstFall;
    },
    // ────────────────────────────────────────────────────────────────────────

    openDropoutChartRun(idx: number) {
      const resume = this.dropoutsResumes[idx];
      const item = this.dropouts[idx];
      
      this.chartRunModal = {
        show: true,
        title: `Chart Run - ${item.name}${item.artist ? ` (${item.artist})` : ''} - DROPOUT`,
        data: {
          runs: resume.stats.run,
          peak: resume.stats.peak,
          peakTimes: resume.stats.peak_times,
          totalWeeks: resume.total,
          currentRank: 0,
          averagePosition: this.calculateAveragePosition(resume.stats.run),
          debutPosition: resume.debut.rank,
          totalPlaycount: resume.stats.playcount_sum,
          chartPoints: resume.stats.points,
          name: item.name,
          artist: item.artist,
          currentWeekIndex: this.index
        }
      };
    },
    openChartRunModal(itemIndex: number) {
      const resume = this.resumes[itemIndex];
      const item = this.items[itemIndex];
      
      this.chartRunModal = {
        show: true,
        title: `Chart Run - ${item.name}${item.artist ? ` (${item.artist})` : ''}`,
        data: {
          runs: resume.stats.run,
          peak: resume.stats.peak,
          peakTimes: resume.stats.peak_times,
          totalWeeks: resume.total,
          currentRank: resume.current.rank,
          averagePosition: this.calculateAveragePosition(resume.stats.run),
          debutPosition: resume.debut.rank,
          totalPlaycount: resume.stats.playcount_sum,
          chartPoints: resume.stats.points,
          name: item.name,
          artist: item.artist,
          currentWeekIndex: this.index
        }
      };
    },
    goToChartWeek(weekIndex: number) {
      this.setIndex(weekIndex, true);
      this.chartRunModal.show = false;
      this.$router.push({ 
        name: 'weekly.' + this.type, 
        params: { week: String(weekIndex + 1) } 
      });
    }
  },
  data() {
    const week = this.$route.params.week ? parseInt(this.$route.params.week as string, 10) : 0;
    const di = getUserChartLength(this.user, this.chartType) - 1;
    return {
      index: week > 0 && week <= di ? week - 1 : di,
      selected: this.type,
      chartRunModal: {
        show: false,
        title: '',
        data: null
      } as ChartRunModalState
    };
  },
  watch: {
    totalCharts() {
      if (this.totalCharts === 1) {
        this.setIndex(0);
        // @ts-ignore
        this.$scrollTo('#chart');
        this.$notify({
          group: 'app',
          type: 'success',
          duration: 20000,
          title: this.$t('messages.first_week') + '',
          text: this.$t('messages.first_week_sub') + '',
        });
      }
    },
    user() {
      const week = this.$route.params.week ? parseInt(this.$route.params.week as string, 10) : 0;
      const di = getUserChartLength(this.user, this.chartType) - 1;
      this.index = week > 0 && week <= di ? week - 1 : di;
    },
  },
});
</script>

<style scoped>
/* Centered content */
.justify-content-center {
  justify-content: center !important;
}

.text-center {
  text-align: center !important;
}

/* Artist link styles */
.artist-link {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease;
  font-weight: 700 !important;
  color: #87CEEB !important;
}

.artist-link:hover {
  color: #5bb0e0 !important;
  text-decoration: underline;
}

.bg-dark .artist-link {
  color: #87CEEB !important;
}

.bg-dark .artist-link:hover {
  color: #5bb0e0 !important;
}

.sub .artist-link {
  font-size: 0.875rem;
  color: #87CEEB !important;
}

.bg-dark .sub .artist-link {
  color: #87CEEB !important;
}

.bg-dark .sub .artist-link:hover {
  color: #5bb0e0 !important;
}

/* Table column widths */
.w-65, .w-60 {
  width: 60%;
  min-width: 250px;
}

.w-40 {
  width: 40%;
  min-width: 180px;
}

.w-25, .w-20 {
  width: 20%;
  min-width: 120px;
}

.title-both {
  min-width: 300px;
}

/* Medal Rank Colors */
.rank-gold {
  color: #FFD700 !important;
  font-weight: bold;
}

.rank-silver {
  color: #C0C0C0 !important;
  font-weight: bold;
}

.rank-bronze {
  color: #CD7F32 !important;
  font-weight: bold;
}

.rank-iron {
  color: #58bcc6 !important;
  font-weight: bold;
}

.rank-new {
  color: #87CEEB !important;
  font-weight: bold;
}

.rank-re {
  color: #fd7e14 !important;
  font-weight: bold;
}

/* Medal Icons Styles */
.gold-medal {
  color: #FFD700;
  filter: drop-shadow(0 1px 2px rgba(255, 215, 0, 0.3));
}

.silver-medal {
  color: #C0C0C0;
  filter: drop-shadow(0 1px 2px rgba(192, 192, 192, 0.3));
}

.bronze-medal {
  color: #CD7F32;
  filter: drop-shadow(0 1px 2px rgba(205, 127, 50, 0.3));
}

.iron-medal {
  color: #A19D94;
  filter: drop-shadow(0 1px 2px rgba(161, 157, 148, 0.3));
}

.d-flex.align-items-center.justify-content-center {
  gap: 4px;
}

.gold-medal,
.silver-medal,
.bronze-medal,
.iron-medal {
  font-size: 0.9em;
  width: 16px;
  height: 16px;
}

.text-center {
  padding: 0.5rem !important;
}

/* Biggest movement labels */
.biggest-movement {
  font-size: 0.7rem;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

/* Chart Run Button */
.chart-run-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 4px;
}

/* Dropout Chart Section */
.dropout-card {
  border-color: #dc3545 !important;
}

.dropout-card .card-header {
  background-color: rgba(220, 53, 69, 0.1) !important;
  border-bottom-color: #dc3545 !important;
  color: #dc3545 !important;
}

.bg-dark .dropout-card .card-header {
  background-color: rgba(220, 53, 69, 0.2) !important;
  color: #ff6b6b !important;
}

.dropout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.dropout-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba(248, 249, 250, 0.5);
  border-radius: 8px;
  border: 1px solid #dee2e6;
  transition: all 0.2s ease;
}

.bg-dark .dropout-item {
  background: rgba(52, 58, 64, 0.5);
  border-color: #495057;
}

.dropout-item:hover {
  background: rgba(248, 249, 250, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 3px 10px rgba(0,0,0,0.1);
}

.bg-dark .dropout-item:hover {
  background: rgba(52, 58, 64, 0.8);
}

.dropout-rank {
  flex: 0 0 50px;
  text-align: center;
}

.rank-badge {
  display: inline-block;
  width: 36px;
  height: 36px;
  line-height: 36px;
  background: #6c757d;
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 0.9rem;
}

.dropout-content {
  flex: 1;
  padding: 0 15px;
}

.dropout-name {
  margin-bottom: 5px;
}

.dropout-artist {
  display: block;
  font-size: 0.85rem;
  color: #6c757d;
  margin-top: 2px;
}

.dropout-artist .artist-link {
  font-weight: 600 !important;
  color: #87CEEB !important;
}

.dropout-artist .artist-link:hover {
  color: #5bb0e0 !important;
  text-decoration: underline;
}

.bg-dark .dropout-artist {
  color: #adb5bd;
}

.bg-dark .dropout-artist .artist-link {
  color: #87CEEB !important;
}

.bg-dark .dropout-artist .artist-link:hover {
  color: #5bb0e0 !important;
}

.dropout-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 0.8rem;
}

.stat-item {
  color: #6c757d;
}

.bg-dark .stat-item {
  color: #adb5bd;
}

.dropout-action {
  flex: 0 0 40px;
}

/* Chart Run Modal */
.chart-run-header {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
}

.bg-dark .chart-run-header {
  background: #2c3e50;
  border-color: #34495e;
}

.chart-run-header h5 {
  margin-bottom: 10px;
  color: #2c3e50;
}

.bg-dark .chart-run-header h5 {
  color: #ecf0f1;
}

.compact-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 15px;
}

.compact-stat {
  text-align: center;
  padding: 8px;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.bg-dark .compact-stat {
  background: #34495e;
  border-color: #2c3e50;
}

.compact-stat-label {
  font-size: 0.75rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 3px;
}

.bg-dark .compact-stat-label {
  color: #bdc3c7;
}

.compact-stat-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #2c3e50;
}

.bg-dark .compact-stat-value {
  color: #ecf0f1;
}

.compact-chart-runs {
  max-height: 50vh;
  overflow-y: auto;
  padding-right: 10px;
}

.compact-run {
  margin-bottom: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  overflow: hidden;
}

.bg-dark .compact-run {
  background: #2c3e50;
  border-color: #34495e;
}

.compact-run-header {
  background: #e9ecef;
  padding: 10px 15px;
  border-bottom: 1px solid #dee2e6;
}

.bg-dark .compact-run-header {
  background: #34495e;
  border-color: #2c3e50;
}

.compact-run-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.bg-dark .compact-run-title {
  color: #ecf0f1;
}

.compact-run-dates {
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 3px;
}

.bg-dark .compact-run-dates {
  color: #bdc3c7;
}

.compact-run-weeks {
  font-size: 0.75rem;
  color: #6c757d;
  margin-left: 5px;
}

.compact-weeks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  padding: 15px;
}

.compact-week-item {
  background: white;
  border-radius: 6px;
  padding: 10px;
  border: 1px solid #dee2e6;
  cursor: pointer;
  transition: all 0.2s ease;
}

.bg-dark .compact-week-item {
  background: #34495e;
  border-color: #2c3e50;
}

.compact-week-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0,0,0,0.1);
  border-color: #87CEEB;
}

.compact-week-header {
  margin-bottom: 8px;
}

.compact-week-number {
  font-size: 0.8rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 2px;
}

.bg-dark .compact-week-number {
  color: #ecf0f1;
}

.compact-week-date {
  font-size: 0.75rem;
  color: #6c757d;
}

.bg-dark .compact-week-date {
  color: #bdc3c7;
}

.compact-week-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.compact-week-rank {
  flex: 1;
}

.compact-rank-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 0.85rem;
  min-width: 45px;
  text-align: center;
}

.compact-rank-badge.rank-gold {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #333;
}

.compact-rank-badge.rank-silver {
  background: linear-gradient(135deg, #C0C0C0, #A0A0A0);
  color: #333;
}

.compact-rank-badge.rank-bronze {
  background: linear-gradient(135deg, #CD7F32, #A0522D);
  color: white;
}

.compact-rank-badge.rank-iron {
  background: linear-gradient(135deg, #A19D94, #7A756C);
  color: white;
}

.compact-rank-badge.rank-new {
  background: linear-gradient(135deg, #87CEEB, #5bb0e0);
  color: white;
}

.compact-rank-badge.rank-re {
  background: linear-gradient(135deg, #fd7e14, #e96a00);
  color: white;
}

.compact-week-plays {
  font-size: 0.8rem;
  color: #2c3e50;
  margin: 0 8px;
}

.bg-dark .compact-week-plays {
  color: #ecf0f1;
}

.compact-week-trend {
  flex: 0 0 20px;
  text-align: center;
}

.compact-run-separator {
  padding: 8px 15px;
  text-align: center;
  background: #f1f3f4;
  border-top: 1px solid #dee2e6;
}

.bg-dark .compact-run-separator {
  background: #2c3e50;
  border-color: #34495e;
}

.compact-separator-text {
  color: #6c757d;
  font-size: 0.8rem;
  font-weight: 500;
}

.bg-dark .compact-separator-text {
  color: #bdc3c7;
}

.compact-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e9ecef;
}

.bg-dark .compact-summary {
  background: #2c3e50;
  border-color: #34495e;
}

.compact-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.compact-summary-item {
  text-align: center;
}

.compact-summary-label {
  font-size: 0.75rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 3px;
}

.bg-dark .compact-summary-label {
  color: #bdc3c7;
}

.compact-summary-value {
  font-size: 1.1rem;
  font-weight: bold;
  color: #2c3e50;
}

.bg-dark .compact-summary-value {
  color: #ecf0f1;
}

.current-week {
  border-color: #87CEEB;
  background-color: rgba(135, 206, 235, 0.1);
}

.bg-dark .current-week {
  background-color: rgba(135, 206, 235, 0.15);
}

.peak-week {
  border-color: #FFD700;
  background-color: rgba(255, 215, 0, 0.05);
}

.bg-dark .peak-week {
  background-color: rgba(255, 215, 0, 0.1);
}

.debut-week {
  border-color: #2ecc71;
  background-color: rgba(46, 204, 113, 0.05);
}

.bg-dark .debut-week {
  background-color: rgba(46, 204, 113, 0.1);
}

.compact-chart-runs::-webkit-scrollbar {
  width: 6px;
}

.compact-chart-runs::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.compact-chart-runs::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.compact-chart-runs::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.bg-dark .compact-chart-runs::-webkit-scrollbar-track {
  background: #2c3e50;
}

.bg-dark .compact-chart-runs::-webkit-scrollbar-thumb {
  background: #4a6278;
}

.bg-dark .compact-chart-runs::-webkit-scrollbar-thumb:hover {
  background: #5a7288;
}

@media (max-width: 768px) {
  .w-65, .w-60, .w-40, .w-25, .w-20 {
    min-width: auto;
    width: 100%;
  }
  
  .title-both {
    min-width: auto;
  }
  
  .compact-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .compact-weeks-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .compact-summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .dropout-grid {
    grid-template-columns: 1fr;
  }
  
  .gold-medal,
  .silver-medal,
  .bronze-medal,
  .iron-medal {
    font-size: 0.8em;
    width: 14px;
    height: 14px;
  }
  
  .d-flex.align-items-center.justify-content-center {
    gap: 2px;
  }
}

@media (max-width: 480px) {
  .compact-weeks-grid {
    grid-template-columns: 1fr;
  }
  
  .compact-summary-grid {
    grid-template-columns: 1fr;
  }
  
  .compact-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>