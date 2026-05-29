<template>
  <div>
    <b-container>
      <b-row v-if="user.weeklyCharts?.weeks?.length">
        <b-col class="px-0 px-sm-3">
          <b-card class="mb-4 mt-3 shadow border-0 text-center"
                  :bg-variant="theme === 'light' ? 'white' : 'dark'"
                  :text-variant="theme === 'light' ? 'dark' : 'white'"
                  id="chart">
            <h4 class="mb-3">Weekly.live</h4>
            <div class="d-flex justify-content-center align-items-center mb-3">
              <b-button 
                size="sm" 
                class="mr-2" 
                variant="outline-danger" 
                @click="load"
                :aria-label="$t('chart.refresh') || 'Refresh'"
                :disabled="isLoading"
              >
                <font-awesome-icon :icon="['fas', 'sync']" :spin="isLoading" />
              </b-button>
              <p class="mb-0">
                {{ startDate }} - {{ endDate }}
              </p>
            </div>
            <div class="d-flex justify-content-center" v-if="!isLoading">
              <live-table :week="week" :theme="theme" v-if="week"></live-table>
            </div>
            <div v-else class="text-center p-4">
              <b-spinner variant="danger" label="Loading..."></b-spinner>
            </div>
            <b-alert 
              v-if="error" 
              show 
              variant="danger" 
              class="mt-3"
              dismissible
              @dismissed="error = null"
            >
              {{ error }}
            </b-alert>
          </b-card>
        </b-col>
      </b-row>
      <b-row v-else>
        <b-col class="px-0 px-sm-3">
          <b-card class="mb-4 mt-3 shadow border-0 text-center"
                  :bg-variant="theme === 'light' ? 'white' : 'dark'"
                  :text-variant="theme === 'light' ? 'dark' : 'white'"
                  id="chart">
            <b-link to="/weekly" class="btn btn-outline-danger">{{ $t('chart.update') }}</b-link>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { fixedStartDate, getWeeklyList } from '@/charts';
import moment from "moment/moment";
import LiveTable from "@/components/LiveTable.vue";

interface WeeklyData {
  load: (login: string) => Promise<any>;
}

export default Vue.extend({
  name: 'WeekLive',
  components: {
    'live-table': LiveTable,
  },
  data() {
    return {
      week: null as WeeklyData | null,
      isLoading: false,
      error: null as string | null,
    }
  },
  computed: {
    user() {
      return this.$store.getters.getDefaultUser;
    },
    theme(): string {
      return this.$store.getters.getTheme;
    },
    start(): Date {
      return fixedStartDate(new Date(), this.user.weeklyCharts?.startDay || 0);
    },
    startDate(): string {
      return moment(this.start).format('YYYY-MM-DD HH:mm');
    },
    end(): Date {
      return moment(this.start).add(1, 'weeks').toDate();
    },
    endDate(): string {
      return moment(this.end).format('YYYY-MM-DD HH:mm');
    },
    limitBuffer(): number {
      const BUFFER_SIZE = 10;
      return Number(this.user.weeklyCharts?.limit || 0) + BUFFER_SIZE;
    }
  },
  watch: {
    'user.weeklyCharts': {
      handler() {
        this.load();
      },
      deep: true
    },
    start() {
      this.load();
    },
    end() {
      this.load();
    }
  },
  methods: {
    async load() {
      if (this.isLoading) return;
      
      this.isLoading = true;
      this.error = null;
      
      try {
        if (!this.user?.login) {
          throw new Error('User login information is missing');
        }
        
        if (!this.user.weeklyCharts?.limit) {
          throw new Error('Weekly chart limit configuration is missing');
        }
        
        const list = getWeeklyList(this.start, this.end, this.limitBuffer);
        
        if (!list || !list.length) {
          throw new Error('No weekly data available');
        }
        
        const response = await list[0].load(this.user.login);
        this.week = response as WeeklyData;
      } catch (err) {
        console.error('Failed to load weekly data:', err);
        this.error = err instanceof Error ? err.message : 'Failed to load weekly data. Please try again.';
        this.week = null;
      } finally {
        this.isLoading = false;
      }
    },
    
    retryLoad() {
      this.load();
    }
  },
  
  created() {
    this.load();
  },
  
  beforeDestroy() {
    this.isLoading = false;
    this.error = null;
  },
});
</script>

<style scoped>
/* Center all content */
.text-center {
  text-align: center !important;
}

/* Center card content */
.b-card {
  margin: 0 auto;
  max-width: 1200px;
}

/* Center the button and date */
.d-flex.justify-content-center {
  justify-content: center !important;
}

.d-flex.align-items-center {
  align-items: center !important;
}

/* Center live table */
.live-table-container {
  margin: 0 auto;
}

/* Loading state improvements */
.b-spinner {
  margin: 20px auto;
}

/* Button loading state */
.btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

/* Alert styling */
.alert {
  text-align: left;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .b-card {
    margin: 0 10px;
    padding: 15px;
  }
  
  .d-flex.justify-content-center {
    flex-direction: column;
    gap: 10px;
  }
  
  .mr-2 {
    margin-right: 0 !important;
    margin-bottom: 10px;
  }
}
</style>