import { User, Week, Artist, Album, Track } from '@/charts';
import moment from 'moment';
import { Stats } from '@/charts';
import { getUserChartList } from '@/charts/helpers';

export default {
    getUser: (state: any) => (login: string) => {
        return state.users.find((user: User) => user.login === login);
    },
    getUsers: (state: any) => {
        return state.users;
    },
    getUsersAsOptions: (state: any, getters: any) => {
        const options: object[] = [];
        const users = getters.getUsers;
        for (const user of users) {
            options.push({ value: user.login, text: user.login });
        }
        return options;
    },
    getUsersCount: (state: any, getters: any) => {
        return getters.getUsers.length;
    },
    getDefaultUser: (state: any, getters: any) => {
        const defaultUser = getters.getUser(state.currentUser);
        if (defaultUser) {
            return defaultUser;
        }
        const users = getters.getUsers;
        if (users.length > 0) {
            return users[0];
        }
        return null;
    },
    getDefaultUserName: (state: any, getters: any) => {
        const defaultName = getters.getDefaultUser;
        if (defaultName !== null) {
            return defaultName.login;
        }
        return null;
    },
    getStats: (state: any, getters: any) =>
    (chart: string, type: string, name: string, artist: string|null = null, year: string|null = null) => {

        const user = getters.getDefaultUser;
        const stats = new Stats(type, name, artist);
        const searchAT = (entry: Album|Track) => entry.name === name && entry.artist === artist;
        const searchA = (entry: Artist) => entry.name === name;
        const search = (type !== 'artists' && type !== 'artist') ? searchAT : searchA;
        if (user !== null) {
            const charts = getUserChartList(user, chart);
            for (let i = 0; i < charts.length; i++) {
                if (year === null || moment(charts[i].end).format('YYYY') === year) {
                    stats.add(i, charts[i], charts[i][type].find(search));
                }
            }
        }
        return stats;
    },
    getArtistReleases: (state: any, getters: any) => 
    (artistName: string) => {
        const user = getters.getDefaultUser;
        if (!user) {
            return [];
        }
        
        const allReleases: any[] = [];
        
        // Try different chart types
        const chartTypes = ['weekly', 'monthly', 'yearly']; // Adjust based on your available charts
        
        chartTypes.forEach(chartType => {
            try {
                const charts = getUserChartList(user, chartType);
                
                charts.forEach((chart: any) => {
                    // Check albums in the chart
                    if (chart.albums && Array.isArray(chart.albums)) {
                        chart.albums.forEach((album: Album) => {
                            if (album.artist === artistName) {
                                // Check if this album already exists in our list
                                const existingRelease = allReleases.find(r => 
                                    r.name === album.name && r.artist === artistName
                                );
                                
                                if (!existingRelease) {
                                    // Create a new object with album properties and additional metadata
                                    const releaseData = {
                                        ...album, // Spread album properties first
                                        chartType,
                                        firstSeen: chart.end,
                                        peakPosition: chart.albums.indexOf(album) + 1,
                                        releaseType: 'album' // Default to album since we're in albums list
                                    };
                                    
                                    allReleases.push(releaseData);
                                } else {
                                    // Update peak position if better
                                    const position = chart.albums.indexOf(album) + 1;
                                    if (position < existingRelease.peakPosition) {
                                        existingRelease.peakPosition = position;
                                    }
                                }
                            }
                        });
                    }
                });
            } catch (error) {
                console.warn(`Could not load ${chartType} charts:`, error);
            }
        });
        
        // Sort alphabetically by default
        return allReleases.sort((a, b) => a.name.localeCompare(b.name));
    },
    getReleaseStats: (state: any, getters: any) =>
    (artistName: string, releaseName: string, chartType: string = 'weekly') => {
        const user = getters.getDefaultUser;
        if (!user) {
            return null;
        }
        
        const charts = getUserChartList(user, chartType);
        const releaseStats = {
            name: releaseName,
            artist: artistName,
            firstSeen: null as string | null,
            lastSeen: null as string | null,
            peakPosition: null as number | null,
            weeksOnChart: 0,
            weeksData: [] as any[],
            totalWeeks: charts.length
        };
        
        charts.forEach((chart: any, index: number) => {
            if (chart.albums && Array.isArray(chart.albums)) {
                const album = chart.albums.find((a: Album) => 
                    a.name === releaseName && a.artist === artistName
                );
                
                if (album) {
                    const position = chart.albums.indexOf(album) + 1;
                    const weekData = {
                        date: chart.end,
                        position,
                        chartIndex: index,
                        weekData: chart
                    };
                    
                    releaseStats.weeksData.push(weekData);
                    releaseStats.weeksOnChart++;
                    
                    if (!releaseStats.firstSeen) {
                        releaseStats.firstSeen = chart.end;
                    }
                    releaseStats.lastSeen = chart.end;
                    
                    if (!releaseStats.peakPosition || position < releaseStats.peakPosition) {
                        releaseStats.peakPosition = position;
                    }
                }
            }
        });
        
        return releaseStats;
    },
    getWeekDays: (state: any) => {
        const wk = moment.weekdays();
        const days = [];
        for (const key in wk) {
          if (wk.hasOwnProperty(key)) {
            days.push({ value: key, text: wk[key] });
          }
        }
        return days;
    },
    getCardOpen: (state: any) => {
        return state.cardOpen;
    },
    getTable: (state: any) => {
        return state.table;
    },
    getImages: (state: any) => {
        return state.images;
    },
    getTheme: (state: any) => {
        return state.theme;
    },
};