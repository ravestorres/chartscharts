import moment from 'moment';
import {Week, Artist, Album, Track, User, WeeklyCharts, MonthlyCharts, YearlyCharts, Stats} from '@/charts';

const fixedStartDate = (start: Date, weekDay: number) => {
    const n = moment(start);
    const c = n.day(n.day() >= weekDay ? weekDay : (weekDay - 7));
    const date = c.toDate();
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    return date;
};

const getWeeklyList = (start: Date, end: Date, limit: number) => {
    const weeks = [];
    let next = moment(start).add(1, 'weeks').toDate();
    while (next <= end) {
        weeks.push(new Week(start, next, limit));
        start = next;
        next = moment(start).add(1, 'weeks').toDate();
    }
    return weeks;
};

const fixArtistChart = (data: any, limit: number, untied: boolean = false) => {
    const chart: Artist[] = [];
    const list = data.weeklyartistchart.artist;
    if (list.length < limit || limit < 1) {
        limit = list.length;
    }
    let maxPlays = 0, plays = 0;
    for (let i = 0; i < limit; i++) {
        chart.push(new Artist(list[i].name, parseInt(list[i]['@attr'].rank, 10), parseInt(list[i].playcount, 10)));
        maxPlays = parseInt(list[i].playcount, 10);
    }
    if (untied && list.length > limit) {
        for (let i = limit; i < list.length; i++) {
            plays = parseInt(list[i].playcount, 10);
            if (plays === maxPlays) {
                chart.push(new Artist(list[i].name, parseInt(list[i]['@attr'].rank, 10), parseInt(list[i].playcount, 10)));
            } else {
                break;
            }
        }
    }
    return chart;
};

const fixAlbumChart = (data: any, limit: number, untied: boolean = false) => {
    const chart: Album[] = [];
    const list = data.weeklyalbumchart.album;
    if (list.length < limit || limit < 1) {
        limit = list.length;
    }
    let maxPlays = 0, plays = 0;
    for (let i = 0; i < limit; i++) {
        chart.push(
            new Album(
                list[i].name,
                list[i].artist['#text'],
                parseInt(list[i]['@attr'].rank, 10),
                parseInt(list[i].playcount, 10)));
        maxPlays = parseInt(list[i].playcount, 10);
    }
    if (untied && list.length > limit) {
        for (let i = limit; i < list.length; i++) {
            plays = parseInt(list[i].playcount, 10);
            if (plays === maxPlays) {
                chart.push(
                    new Album(
                        list[i].name,
                        list[i].artist['#text'],
                        parseInt(list[i]['@attr'].rank, 10),
                        parseInt(list[i].playcount, 10)));
            } else {
                break;
            }
        }
    }
    return chart;
};

const fixTrackChart = (data: any, limit: number, untied: boolean = false) => {
    const chart: Track[] = [];
    const list = data.weeklytrackchart.track;
    if (list.length < limit || limit < 1) {
        limit = list.length;
    }
    let maxPlays = 0, plays = 0;
    for (let i = 0; i < limit; i++) {
        chart.push(
            new Track(
                list[i].name,
                list[i].artist['#text'],
                parseInt(list[i]['@attr'].rank, 10),
                parseInt(list[i].playcount, 10)));
        maxPlays = parseInt(list[i].playcount, 10);
    }
    if (untied && list.length > limit) {
        for (let i = limit; i < list.length; i++) {
            plays = parseInt(list[i].playcount, 10);
            if (plays === maxPlays) {
                chart.push(
                    new Track(
                        list[i].name,
                        list[i].artist['#text'],
                        parseInt(list[i]['@attr'].rank, 10),
                        parseInt(list[i].playcount, 10)));
            } else {
                break;
            }
        }
    }
    return chart;
};

const getUserChart = (user: User, chart: string): WeeklyCharts|MonthlyCharts|YearlyCharts => {
    if (chart === 'year') {
        return user.yearlyCharts;
    } else if (chart === 'month') {
        return user.monthlyCharts;
    } else {
        return user.weeklyCharts;
    }
};

const getUserChartList = (user: User, chart: string): any => {
    if (chart === 'year') {
        return user.yearlyCharts.years;
    } else if (chart === 'month') {
        return user.monthlyCharts.months;
    } else {
        return user.weeklyCharts.weeks;
    }
};

const getUserChartLength = (user: User, chart: string): number => {
    if (chart === 'year') {
        return user.yearlyCharts.years.length;
    } else if (chart === 'month') {
        return user.monthlyCharts.months.length;
    } else {
        return user.weeklyCharts.weeks.length;
    }
};

const getDropouts = (chart: string, type: string, previous: any[], current: any[]) => {
    let dropouts = [];
    for (let i = 0; i < previous.length; i++) {
        if (type === 'artists') {
            if (current.find(x => x.name === previous[i].name) === undefined) {
                dropouts.push(previous[i]);
            }
        } else {
            if (current.find(x => x.name === previous[i].name && x.artist === previous[i].artist) === undefined) {
                dropouts.push(previous[i]);
            }
        }
    }
    return dropouts;
};

export const getMostPlays = (
    weeks: any[],
    type: string,
    rank: number | null = null,
    year: string | null = null
) => {
    let y = null;
    if (year && parseInt(year, 10) > 0) {
        y = year;
    }

    let topEntries: any[] = [];
    let minPlaycountInTop = 0;

    for (let i = 0; i < weeks.length; i++) {
        const week = weeks[i];
        const items = week[type];

        if (!items || !Array.isArray(items)) continue;
        if (y && moment(week.end).format('YYYY') !== y) continue;

        const filteredItems = rank !== null && rank > 0
            ? items.filter(item => item.rank === rank)
            : items;

        for (const entry of filteredItems) {
            const playcount = entry.playcount;

            // Otimização: se já temos 200 e playcount menor que o menor atual, ignora
            if (topEntries.length >= 200 && playcount <= minPlaycountInTop) {
                continue;
            }

            const obj: any = {
                name: entry.name,
                playcount: entry.playcount,
                rank: entry.rank,
                week: i + 1,
                week_end: moment(week.end).format('YYYY-MM-DD'),
                week_start: moment(week.start).format('YYYY-MM-DD'),
            };

            if (type !== 'artists') {
                obj.artist = entry.artist;
                obj.id = `${entry.name} - ${entry.artist}`;
            } else {
                obj.id = entry.name;
            }

            topEntries.push(obj);

            // Ordena e mantém apenas os 200 com maior playcount
            topEntries.sort((a, b) => b.playcount - a.playcount);
            if (topEntries.length > 200) {
                topEntries.length = 200;
            }

            minPlaycountInTop = topEntries[topEntries.length - 1].playcount;
        }
    }

    return topEntries;
};

export const getBiggestDebuts = (
    weeks: any[],
    type: string,
    rank: number | null = null,
    year: string | null = null
) => {
    let y = null;
    if (year && parseInt(year, 10) > 0) {
        y = year;
    }
    const seen = new Set<string>();
    let topEntries: any[] = [];
    let minPlaycountInTop = 0;

    for (let i = 0; i < weeks.length; i++) {
        const week = weeks[i];
        const items = week[type];

        if (!items || !Array.isArray(items)) continue;

        const filteredItems = (rank !== null && rank > 0)
            ? items.filter(item => item.rank === rank)
            : items;

        for (const entry of filteredItems) {
            let id = entry.name;
            if (type !== 'artists') {
                id += ' - ' + entry.artist;
            }

            if (seen.has(id)) continue;
            seen.add(id);

            const weekYear = moment(week.end).format('YYYY');
            if (y && weekYear !== y) continue; // só inclui se for do ano filtrado

            const playcount = entry.playcount;
            if (topEntries.length >= 200 && playcount <= minPlaycountInTop) continue;

            const obj: any = {
                name: entry.name,
                playcount: playcount,
                rank: entry.rank,
                week: i + 1,
                week_end: moment(week.end).format('YYYY-MM-DD'),
                week_start: moment(week.start).format('YYYY-MM-DD'),
                id,
            };

            if (type !== 'artists') {
                obj.artist = entry.artist;
            }

            topEntries.push(obj);

            // Ordena e mantém apenas os 200 maiores
            topEntries.sort((a, b) => b.playcount - a.playcount);
            if (topEntries.length > 200) {
                topEntries.length = 200;
            }

            minPlaycountInTop = topEntries[topEntries.length - 1].playcount;
        }
    }

    return topEntries;
};

export const getTopByPoints = (
    weeks: any[],
    type: string,
    year: string | null = null
) => {
    const pointsMap: Record<string, {
        name: string;
        artist?: string;
        points: number;
        weeks: number;
    }> = {};

    let y = null;
    if (year && parseInt(year, 10) > 0) {
        y = year;
    }

    for (let i = 0; i < weeks.length; i++) {
        const week = weeks[i];
        const items = week[type];

        if (!items || !Array.isArray(items)) continue;

        const weekYear = moment(week.end).format('YYYY');
        if (y !== null && weekYear !== y) continue;

        for (const entry of items) {
            const rank = entry.rank;
            if (typeof rank !== 'number' || rank < 1 || rank > 100) continue;

            const points = 101 - rank;

            let id = entry.name;
            if (type !== 'artists') {
                id += ' - ' + entry.artist;
            }

            if (!pointsMap[id]) {
                pointsMap[id] = {
                    name: entry.name,
                    artist: type !== 'artists' ? entry.artist : undefined,
                    points: 0,
                    weeks: 0
                };
            }

            pointsMap[id].points += points;
            pointsMap[id].weeks += 1;
        }
    }

    // Converte para array ordenado por pontos
    const result = Object.entries(pointsMap)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.points - a.points);

    return result;
};

export const getArtistsWithMostEntriesInTopX = (
    weeks: any[],
    type: 'albums' | 'tracks',
    topX: number,
    year: string | null = null
) => {

    const artistMap: Record<string, {
        artist: string;
        uniqueItems: Set<string>;
        totalWeeks: number;
    }> = {};

    let y = null;
    if (year && parseInt(year, 10) > 0) {
        y = year;
    }

    for (let i = 0; i < weeks.length; i++) {
        const week = weeks[i];
        const items = week[type];

        if (!items || !Array.isArray(items)) continue;

        const weekYear = moment(week.end).format('YYYY');
        if (y !== null && weekYear !== y) continue;

        for (const entry of items) {
            const rank = entry.rank;
            if (typeof rank !== 'number' || rank < 1 || rank > topX) continue;

            const artist = entry.artist;
            const itemId = entry.name;

            if (!artistMap[artist]) {
                artistMap[artist] = {
                    artist,
                    uniqueItems: new Set<string>(),
                    totalWeeks: 0
                };
            }

            // Adiciona o item (álbum/música) único
            artistMap[artist].uniqueItems.add(itemId);

            // Soma semana
            artistMap[artist].totalWeeks += 1;
        }
    }

    // Converte para array ordenado
    const result = Object.values(artistMap)
        .map(entry => ({
            artist: entry.artist,
            total_items: entry.uniqueItems.size,
            total_weeks: entry.totalWeeks
        }))
        .sort((a, b) => {
            // Ordena por total de itens, depois por semanas
            if (b.total_items !== a.total_items) {
                return b.total_items - a.total_items;
            }
            return b.total_weeks - a.total_weeks;
        });

    return result;
};

const getListAtRankX = (weeks: any[], type: string, rank: number, year: string|null = null) => {
    let filter = [];
    let y = null;
    if (year && parseInt(year, 10) > 0) {
        y = year;
    }
    let times: Record<string, number> = {};
    for (let i = 0; i < weeks.length; i++) {
        if (weeks[i][type][rank - 1] && (y === null || moment(weeks[i].end).format('YYYY') === y)) {
            let id = weeks[i][type][rank - 1].name;
            if (type !== 'artists') {
                id += ' - ' + weeks[i][type][rank - 1].artist;
            }
            if (typeof times[id] === 'undefined') {
                times[id] = 0;
            }
            times[id]++;
            let obj = {
                week: i + 1,
                week_end: moment(weeks[i].end).format('YYYY-MM-DD'),
                week_start: moment(weeks[i].start).format('YYYY-MM-DD'),
                playcount: weeks[i][type][rank - 1].playcount,
                name: weeks[i][type][rank - 1].name,
                times: times[id],
            } as any;
            if (type !== 'artists') {
                obj.artist = weeks[i][type][rank - 1].artist;
            }
            filter.push(obj);
        }
    }
    filter.reverse();
    return filter;
}

const getRankListAtRankX = (weeks: any[], type: string, rank: number, year: string|null = null) => {
    let filter = [];
    let f = 0;
    let y = null;
    if (year && parseInt(year, 10) > 0) {
        y = year;
    }
    let times: Record<string, number> = {};
    for (let i = 0; i < weeks.length; i++) {
        if (weeks[i][type][rank - 1] && (y === null || moment(weeks[i].end).format('YYYY') === y)) {
            let id = weeks[i][type][rank - 1].name;
            if (type !== 'artists') {
                id += ' - ' + weeks[i][type][rank - 1].artist;
            }
            if (typeof times[id] === 'undefined') {
                times[id] = f;
                let obj = {
                    name: weeks[i][type][rank - 1].name,
                    last_week: moment(weeks[i].end).format('YYYY-MM-DD'),
                    times: 1,
                } as any;
                if (type !== 'artists') {
                    obj.artist = weeks[i][type][rank - 1].artist;
                }
                filter.push(obj);
                f++;
            } else {
                filter[times[id]].times++;
                filter[times[id]].last_week = moment(weeks[i].end).format('YYYY-MM-DD');
            }
        }
    }
    filter.sort((a, b) => b.times - a.times || new Date(a.last_week).getTime() - new Date(b.last_week).getTime());
    return filter;
}

const getRankListAtTopX = (weeks: any[], type: string, rank: number, year: string|null = null) => {
    let filter = [];
    let f = 0;
    let y = null;
    if (year && parseInt(year, 10) > 0) {
        y = year;
    }
    let times: Record<string, number> = {};
    for (let i = 0; i < weeks.length; i++) {
        for (let j = 0; j < rank; j++) {
            if (weeks[i][type][j] && (y === null || moment(weeks[i].end).format('YYYY') === y)) {
                let id = weeks[i][type][j].name;
                if (type !== 'artists') {
                    id += ' - ' + weeks[i][type][j].artist;
                }
                if (typeof times[id] === 'undefined') {
                    times[id] = f;
                    let obj = {
                        name: weeks[i][type][j].name,
                        last_week: moment(weeks[i].end).format('YYYY-MM-DD'),
                        times: 1,
                    } as any;
                    if (type !== 'artists') {
                        obj.artist = weeks[i][type][j].artist;
                    }
                    filter.push(obj);
                    f++;
                } else {
                    filter[times[id]].times++;
                    filter[times[id]].last_week = moment(weeks[i].end).format('YYYY-MM-DD');
                }
            }
        }
    }
    filter.sort((a, b) => b.times - a.times || new Date(a.last_week).getTime() - new Date(b.last_week).getTime());
    return filter;
}

const getPAKList = (weeks: any[], rank: number, year: string|null = null) => {
    let filter = [];
    let y = null;
    if (year && parseInt(year, 10) > 0) {
        y = year;
    }
    let times: Record<string, number> = {};
    for (let i = 0; i < weeks.length; i++) {
        const checkWeek = weeks[i]['artists'][rank - 1] && weeks[i]['albums'][rank - 1] && weeks[i]['tracks'][rank - 1];
        if (checkWeek && (y === null || moment(weeks[i].end).format('YYYY') === y)) {
            let checkName = weeks[i]['artists'][rank - 1].name;
            if (checkName === weeks[i]['albums'][rank - 1].artist && checkName === weeks[i]['tracks'][rank - 1].artist) {
                if (typeof times[checkName] === 'undefined') {
                    times[checkName] = 0;
                }
                times[checkName]++;
                let obj = {
                    week: i + 1,
                    week_end: moment(weeks[i].end).format('YYYY-MM-DD'),
                    week_start: moment(weeks[i].start).format('YYYY-MM-DD'),
                    artist: checkName,
                    album: weeks[i]['albums'][rank - 1].name,
                    track: weeks[i]['tracks'][rank - 1].name,
                    times: times[checkName],
                } as any;
                filter.push(obj);
            }
        }
    }
    filter.reverse();
    return filter;
}

const moveItem = (array: any[], oldIndex: number, newIndex: number) => {
    if (oldIndex < 0 || oldIndex >= array.length || newIndex < 0 || newIndex >= array.length) {
        return array; // Índices inválidos, retorna o array original
    }

    const itemMovido = array.splice(oldIndex, 1)[0]; // Remove o item do oldIndex e o guarda

    array.splice(newIndex, 0, itemMovido); // Insere o item na newIndex

    return array;
}

// NEW FUNCTIONS FOR ARTIST DETAIL VIEW

/**
 * Get all tracks by a specific artist from weekly charts
 */
export const getArtistTracks = (
    user: User, 
    artistName: string
): Array<{
    name: string;
    artist: string;
    album?: string;
    peakPosition: number;
    weeksOnChart: number;
    firstSeen: string;
    lastSeen: string;
    totalPlaycount: number;
    chartPositions: Array<{
        date: string;
        position: number;
        playcount: number;
        chartIndex: number;
    }>;
}> => {
    const tracksMap = new Map<string, any>();
    const charts = getUserChartList(user, 'weekly');
    
    charts.forEach((chart: any, chartIndex: number) => {
        if (chart.tracks && Array.isArray(chart.tracks)) {
            chart.tracks.forEach((track: any, position: number) => {
                if (track.artist === artistName) {
                    const trackKey = `${track.name}|${track.artist}`;
                    
                    if (!tracksMap.has(trackKey)) {
                        tracksMap.set(trackKey, {
                            name: track.name,
                            artist: track.artist,
                            album: track.album,
                            peakPosition: position + 1,
                            weeksOnChart: 1,
                            firstSeen: chart.end,
                            lastSeen: chart.end,
                            totalPlaycount: track.playcount,
                            chartPositions: [{
                                date: chart.end,
                                position: position + 1,
                                playcount: track.playcount,
                                chartIndex: chartIndex
                            }]
                        });
                    } else {
                        const existingTrack = tracksMap.get(trackKey)!;
                        existingTrack.weeksOnChart++;
                        existingTrack.lastSeen = chart.end;
                        existingTrack.totalPlaycount += track.playcount;
                        
                        // Update peak position
                        if (position + 1 < existingTrack.peakPosition) {
                            existingTrack.peakPosition = position + 1;
                        }
                        
                        // Add chart position
                        existingTrack.chartPositions.push({
                            date: chart.end,
                            position: position + 1,
                            playcount: track.playcount,
                            chartIndex: chartIndex
                        });
                    }
                }
            });
        }
    });
    
    return Array.from(tracksMap.values())
        .sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Get all albums by a specific artist from weekly charts
 */
export const getArtistAlbums = (
    user: User, 
    artistName: string
): Array<{
    name: string;
    artist: string;
    peakPosition: number;
    weeksOnChart: number;
    firstSeen: string;
    lastSeen: string;
    totalPlaycount: number;
    trackCount: number;
    chartPositions: Array<{
        date: string;
        position: number;
        playcount: number;
        chartIndex: number;
    }>;
}> => {
    const albumsMap = new Map<string, any>();
    const charts = getUserChartList(user, 'weekly');
    
    charts.forEach((chart: any, chartIndex: number) => {
        if (chart.albums && Array.isArray(chart.albums)) {
            chart.albums.forEach((album: any, position: number) => {
                if (album.artist === artistName) {
                    const albumKey = album.name;
                    
                    if (!albumsMap.has(albumKey)) {
                        albumsMap.set(albumKey, {
                            name: album.name,
                            artist: album.artist,
                            peakPosition: position + 1,
                            weeksOnChart: 1,
                            firstSeen: chart.end,
                            lastSeen: chart.end,
                            totalPlaycount: album.playcount,
                            trackCount: 0, // Will be calculated separately
                            chartPositions: [{
                                date: chart.end,
                                position: position + 1,
                                playcount: album.playcount,
                                chartIndex: chartIndex
                            }]
                        });
                    } else {
                        const existingAlbum = albumsMap.get(albumKey)!;
                        existingAlbum.weeksOnChart++;
                        existingAlbum.lastSeen = chart.end;
                        existingAlbum.totalPlaycount += album.playcount;
                        
                        // Update peak position
                        if (position + 1 < existingAlbum.peakPosition) {
                            existingAlbum.peakPosition = position + 1;
                        }
                        
                        // Add chart position
                        existingAlbum.chartPositions.push({
                            date: chart.end,
                            position: position + 1,
                            playcount: album.playcount,
                            chartIndex: chartIndex
                        });
                    }
                }
            });
        }
    });
    
    // Calculate track count for each album
    const tracks = getArtistTracks(user, artistName);
    const albums = Array.from(albumsMap.values());
    
    albums.forEach(album => {
        album.trackCount = tracks.filter(track => track.album === album.name).length;
    });
    
    return albums.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Get artist statistics summary
 */
export const getArtistStats = (
    user: User,
    artistName: string
): {
    totalAlbums: number;
    totalTracks: number;
    totalWeeksOnChart: number;
    firstChartDate: string | null;
    lastChartDate: string | null;
    peakPosition: number;
    totalChartEntries: number;
    mostCommonRank: number;
    averagePosition: number;
} => {
    const albums = getArtistAlbums(user, artistName);
    const tracks = getArtistTracks(user, artistName);
    
    let firstChartDate: string | null = null;
    let lastChartDate: string | null = null;
    let peakPosition = Infinity;
    let totalChartEntries = 0;
    let rankSum = 0;
    let rankCount = 0;
    const rankFrequency: Record<number, number> = {};
    
    // Collect data from albums
    albums.forEach(album => {
        if (!firstChartDate || new Date(album.firstSeen) < new Date(firstChartDate)) {
            firstChartDate = album.firstSeen;
        }
        if (!lastChartDate || new Date(album.lastSeen) > new Date(lastChartDate)) {
            lastChartDate = album.lastSeen;
        }
        if (album.peakPosition < peakPosition) {
            peakPosition = album.peakPosition;
        }
        
        album.chartPositions.forEach(pos => {
            totalChartEntries++;
            rankSum += pos.position;
            rankCount++;
            rankFrequency[pos.position] = (rankFrequency[pos.position] || 0) + 1;
        });
    });
    
    // Collect data from tracks
    tracks.forEach(track => {
        if (!firstChartDate || new Date(track.firstSeen) < new Date(firstChartDate)) {
            firstChartDate = track.firstSeen;
        }
        if (!lastChartDate || new Date(track.lastSeen) > new Date(lastChartDate)) {
            lastChartDate = track.lastSeen;
        }
        if (track.peakPosition < peakPosition) {
            peakPosition = track.peakPosition;
        }
        
        track.chartPositions.forEach(pos => {
            totalChartEntries++;
            rankSum += pos.position;
            rankCount++;
            rankFrequency[pos.position] = (rankFrequency[pos.position] || 0) + 1;
        });
    });
    
    // Find most common rank
    let mostCommonRank = 0;
    let maxFrequency = 0;
    Object.entries(rankFrequency).forEach(([rank, freq]) => {
        const rankNum = parseInt(rank, 10);
        if (freq > maxFrequency) {
            maxFrequency = freq;
            mostCommonRank = rankNum;
        }
    });
    
    return {
        totalAlbums: albums.length,
        totalTracks: tracks.length,
        totalWeeksOnChart: albums.reduce((sum, a) => sum + a.weeksOnChart, 0) + 
                          tracks.reduce((sum, t) => sum + t.weeksOnChart, 0),
        firstChartDate,
        lastChartDate,
        peakPosition: peakPosition === Infinity ? 0 : peakPosition,
        totalChartEntries,
        mostCommonRank,
        averagePosition: rankCount > 0 ? Math.round(rankSum / rankCount * 10) / 10 : 0
    };
};

/**
 * Get chart runs (consecutive weeks) for an item
 */
export const getChartRuns = (
    chartPositions: Array<{
        date: string;
        position: number;
        playcount: number;
        chartIndex: number;
    }>
): Array<Array<{
    date: string;
    position: number;
    playcount: number;
    chartIndex: number;
}>> => {
    if (chartPositions.length === 0) {
        return [];
    }
    
    // Sort positions by date
    const sortedPositions = [...chartPositions].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const runs: Array<typeof sortedPositions> = [];
    let currentRun: typeof sortedPositions = [];
    
    for (let i = 0; i < sortedPositions.length; i++) {
        const current = sortedPositions[i];
        const prev = i > 0 ? sortedPositions[i - 1] : null;
        
        if (!prev) {
            currentRun.push(current);
            continue;
        }
        
        // Check if consecutive weeks (within 8 days)
        const currentDate = new Date(current.date);
        const prevDate = new Date(prev.date);
        const daysDiff = Math.abs(currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        
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
};

/**
 * Get year-by-year chart performance for an item
 */
export const getYearlyChartPerformance = (
    chartPositions: Array<{
        date: string;
        position: number;
        playcount: number;
        chartIndex: number;
    }>
): Record<string, {
    year: string;
    appearances: number;
    bestPosition: number;
    totalPlaycount: number;
    weeks: Array<{
        date: string;
        position: number;
        playcount: number;
        chartIndex: number;
    }>;
}> => {
    const yearlyData: Record<string, any> = {};
    
    chartPositions.forEach(pos => {
        const year = moment(pos.date).format('YYYY');
        
        if (!yearlyData[year]) {
            yearlyData[year] = {
                year,
                appearances: 0,
                bestPosition: Infinity,
                totalPlaycount: 0,
                weeks: []
            };
        }
        
        yearlyData[year].appearances++;
        yearlyData[year].totalPlaycount += pos.playcount;
        if (pos.position < yearlyData[year].bestPosition) {
            yearlyData[year].bestPosition = pos.position;
        }
        yearlyData[year].weeks.push(pos);
    });
    
    // Sort weeks by date within each year
    Object.values(yearlyData).forEach((data: any) => {
        data.weeks.sort((a: any, b: any) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    });
    
    return yearlyData;
};

/**
 * Get all artists with their basic stats (for artist index page)
 */
export const getAllArtistsWithStats = (
    user: User
): Array<{
    name: string;
    totalAlbums: number;
    totalTracks: number;
    totalWeeks: number;
    firstSeen: string;
    lastSeen: string;
    peakPosition: number;
}> => {
    const artistsMap = new Map<string, any>();
    const charts = getUserChartList(user, 'weekly');
    
    // Process all charts to collect artist data
    charts.forEach((chart: any) => {
        // Process artists chart
        if (chart.artists && Array.isArray(chart.artists)) {
            chart.artists.forEach((artist: any, position: number) => {
                if (!artistsMap.has(artist.name)) {
                    artistsMap.set(artist.name, {
                        name: artist.name,
                        totalAlbums: 0,
                        totalTracks: 0,
                        totalWeeks: 1,
                        firstSeen: chart.end,
                        lastSeen: chart.end,
                        peakPosition: position + 1
                    });
                } else {
                    const existing = artistsMap.get(artist.name)!;
                    existing.totalWeeks++;
                    existing.lastSeen = chart.end;
                    if (position + 1 < existing.peakPosition) {
                        existing.peakPosition = position + 1;
                    }
                }
            });
        }
        
        // Process albums chart
        if (chart.albums && Array.isArray(chart.albums)) {
            chart.albums.forEach((album: any) => {
                if (artistsMap.has(album.artist)) {
                    artistsMap.get(album.artist)!.totalAlbums++;
                }
            });
        }
        
        // Process tracks chart
        if (chart.tracks && Array.isArray(chart.tracks)) {
            chart.tracks.forEach((track: any) => {
                if (artistsMap.has(track.artist)) {
                    artistsMap.get(track.artist)!.totalTracks++;
                }
            });
        }
    });
    
    // Calculate missing album/track counts from detailed functions
    const artists = Array.from(artistsMap.values());
    
    artists.forEach(artist => {
        try {
            const albums = getArtistAlbums(user, artist.name);
            const tracks = getArtistTracks(user, artist.name);
            
            artist.totalAlbums = albums.length;
            artist.totalTracks = tracks.length;
            
            // Update peak position from detailed data if better
            const albumPeak = albums.length > 0 ? Math.min(...albums.map(a => a.peakPosition).filter(p => p > 0)) : Infinity;
            const trackPeak = tracks.length > 0 ? Math.min(...tracks.map(t => t.peakPosition).filter(p => p > 0)) : Infinity;
            const combinedPeak = Math.min(albumPeak, trackPeak, artist.peakPosition);
            
            if (combinedPeak < artist.peakPosition && combinedPeak > 0 && combinedPeak !== Infinity) {
                artist.peakPosition = combinedPeak;
            }
        } catch (error) {
            console.warn(`Could not get detailed stats for artist ${artist.name}:`, error);
        }
    });
    
    return artists.sort((a, b) => a.name.localeCompare(b.name));
};

export {
    fixedStartDate,
    getWeeklyList,
    fixArtistChart,
    fixAlbumChart,
    fixTrackChart,
    getUserChart,
    getUserChartList,
    getUserChartLength,
    getListAtRankX,
    getRankListAtRankX,
    getRankListAtTopX,
    getDropouts,
    moveItem,
    getPAKList,
};