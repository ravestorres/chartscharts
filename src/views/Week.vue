<template>
  <div>
    <b-container>

      <!-- CHART SECTION -->
      <b-row v-if="user.weeklyCharts?.weeks?.length">
        <b-col cols="12 mt-3" class="text-right">
          <ShareModal />
        </b-col>

        <b-col class="px-0 px-sm-3">

          <!-- ⭐ IMPROVED CARD (READABILITY FIX) -->
          <b-card
            class="mb-4 mt-3 shadow border-0 chart-card"
            :bg-variant="theme === 'light' ? 'white' : 'dark'"
            :text-variant="theme === 'light' ? 'dark' : 'white'"
            id="chart">

            <!-- Add key prop to force re-render when type changes -->
            <ChartTable
              :key="`${type}-${user.login}`"
              chart-type="week"
              :type="type"
              :user.sync="user"
              :loading="loading"
              :theme="theme"
            />

          </b-card>

        </b-col>
      </b-row>

      <!-- NO DATA -->
      <b-row v-else>
        <b-col>
          <b-card
            class="mb-4 mt-3 shadow border-0 chart-card"
            :bg-variant="theme === 'light' ? 'white' : 'dark'"
            :text-variant="theme === 'light' ? 'dark' : 'white'"
            id="chart">

            <b-card-body>
              {{ $t("messages.require_update") }}
            </b-card-body>

          </b-card>
        </b-col>
      </b-row>

      <!-- SETTINGS -->
      <b-row>

        <!-- WEEK SETTINGS -->
        <b-col sm="12" md="6">
          <b-card
            :header-bg-variant="theme === 'light' ? 'dark' : 'white'"
            :header-text-variant="theme === 'light' ? 'white' : 'dark'"
            :bg-variant="theme === 'light' ? 'white' : 'dark'"
            :text-variant="theme === 'light' ? 'dark' : 'white'"
            class="mt-3 border-0 shadow"
            no-body>

            <h6 slot="header" class="mb-0 c-pointer" @click="toggleSettings">
              <font-awesome-icon icon="cog" /> {{ $t("word.settings") }}

              <font-awesome-icon
                :icon="['fa', 'chevron-up']"
                v-if="cardOpen.settingsWeek"
                class="float-right pt-1" />

              <font-awesome-icon
                :icon="['fa', 'chevron-down']"
                v-else
                class="float-right pt-1" />
            </h6>

            <b-card-body :class="cardOpen.settingsWeek ? '' : 'd-none'">
              <WeeklyForm v-bind:user.sync="user" v-bind:loading.sync="loading" />
            </b-card-body>

          </b-card>
        </b-col>

        <!-- UPDATE WIDGET -->
        <b-col sm="12" md="6">
          <b-card
            header-bg-variant="danger"
            header-text-variant="white"
            :bg-variant="theme === 'light' ? 'white' : 'dark'"
            :text-variant="theme === 'light' ? 'dark' : 'white'"
            class="mt-3 border-0 shadow"
            no-body>

            <h6 slot="header" class="mb-0 c-pointer" @click="toggleWidget">

              <b-badge
                :variant="chartsToUpdate() > 0 ? 'warning' : 'danger'"
                @click.stop="updateWeeks">

                <font-awesome-icon icon="sync-alt" />
              </b-badge>

              {{ $t("chart.update") }}

              <b-badge variant="warning" v-if="chartsToUpdate() > 0">
                {{ $t("chart.update_now") }}
              </b-badge>

              <font-awesome-icon
                :icon="['fa', 'chevron-up']"
                v-if="cardOpen.updateWeek"
                class="float-right pt-1" />

              <font-awesome-icon
                :icon="['fa', 'chevron-down']"
                v-else
                class="float-right pt-1" />

            </h6>

            <b-card-body :class="cardOpen.updateWeek ? '' : 'd-none'">
              <WeeklyWidget
                v-bind:user.sync="user"
                v-bind:loading.sync="loading"
                @updateLoading="setLoading"
                :theme="theme"
                :update="cardUpdate"
              />
            </b-card-body>

          </b-card>
        </b-col>

      </b-row>

      <!-- TABLE SETTINGS -->
      <b-row>
        <b-col sm="12">
          <b-card
            :header-bg-variant="theme === 'light' ? 'dark' : 'white'"
            :header-text-variant="theme === 'light' ? 'white' : 'dark'"
            :bg-variant="theme === 'light' ? 'white' : 'dark'"
            :text-variant="theme === 'light' ? 'dark' : 'white'"
            class="mt-3 mb-4 border-0 shadow"
            no-body>

            <h6 slot="header" class="mb-0 c-pointer" @click="toggleTableSettings">
              <font-awesome-icon icon="table" /> {{ $t('chart.table') }}

              <font-awesome-icon
                :icon="['fa', 'chevron-up']"
                v-if="cardOpen.settingsTable"
                class="float-right pt-1" />

              <font-awesome-icon
                :icon="['fa', 'chevron-down']"
                v-else
                class="float-right pt-1" />
            </h6>

            <b-card-body :class="cardOpen.settingsTable ? '' : 'd-none'">
              <SettingsTable chart-type="week" />
            </b-card-body>

          </b-card>
        </b-col>
      </b-row>

    </b-container>
  </div>
</template>

<script>
import moment from 'moment';
import WeeklyForm from '@/components/WeeklyForm.vue';
import WeeklyWidget from '@/components/WeeklyWidget.vue';
import SettingsTable from '@/components/SettingsTable.vue';
import ChartTable from '@/components/ChartTable.vue';
import { fixedStartDate, getWeeklyList } from '@/charts';
import ShareModal from '@/components/ShareModal.vue';

export default {
  name: 'Week',

  props: {
    type: { type: String, default: 'artists' }
  },

  components: {
    WeeklyForm,
    WeeklyWidget,
    ChartTable,
    SettingsTable,
    ShareModal
  },

  computed: {
    user: {
      get() { return this.$store.getters.getDefaultUser; },
      set(v) { this.$store.dispatch('setCurrentUser', v); }
    },
    cardOpen() { return this.$store.getters.getCardOpen; },
    theme() { return this.$store.getters.getTheme; }
  },

  data() {
    return {
      loading: false,
      cardUpdate: 0
    };
  },

  methods: {
    updateWeeks() {
      this.cardUpdate++;
    },

    toggleSettings() {
      this.cardOpen.settingsWeek = !this.cardOpen.settingsWeek;
      this.$store.dispatch('setCardOpen', this.cardOpen);
    },

    toggleWidget() {
      this.cardOpen.updateWeek = !this.cardOpen.updateWeek;
      this.$store.dispatch('setCardOpen', this.cardOpen);
    },

    toggleTableSettings() {
      this.cardOpen.settingsTable = !this.cardOpen.settingsTable;
      this.$store.dispatch('setCardOpen', this.cardOpen);
    },

    setLoading(v) {
      this.loading = v;
    },

    chartsToUpdate() {
      const limit = this.user.weeklyCharts.limit;
      const realStart = fixedStartDate(
        this.user.weeklyCharts.startDate,
        this.user.weeklyCharts.startDay
      );

      const list = getWeeklyList(realStart, new Date(), limit);
      return list.length - this.user.weeklyCharts.weeks.length;
    }
  },

  // Add watch to handle route changes
  watch: {
    '$route.params.type'(newType) {
      // This will trigger a re-render when the type changes via route
      if (newType && newType !== this.type) {
        this.$emit('update:type', newType);
      }
    }
  }
};
</script>

<style scoped>
.c-pointer { cursor: pointer; }

/* ⭐ IMPROVED READABILITY FOR BOTH THEMES */
.chart-card {
  border-radius: 12px;
}

/* DARK MODE FIXES */
:deep(.dark .table) {
  color: #e5e7eb;
}

:deep(.dark .table-striped tbody tr:nth-of-type(odd)) {
  background-color: rgba(255,255,255,0.03);
}

:deep(.dark .table-hover tbody tr:hover) {
  background-color: rgba(255,255,255,0.06);
}

/* Ensure biggest movement styling works in dark mode */
:deep(.biggest-movement) {
  font-weight: bold !important;
  font-style: italic !important;
  font-size: 1.05em;
}

:deep(.movement-up.biggest-movement) {
  color: #34ce57 !important;
}

:deep(.movement-down.biggest-movement) {
  color: #ff4757 !important;
}
</style>