const svg = d3.select("#chart");
const width = +svg.attr("width");
const height = +svg.attr("height");

const margin = { top: 80, right: 30, bottom: 120, left: 30 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const yearSlider = d3.select("#yearSlider");
const yearLabel = d3.select("#yearLabel");

const imageSize = 64;
const imageGap = 18;
const nameGap = 12;

// Map character names to local image files
const imageMap = {
    "Hello Kitty": "images/kitty.png",
    "Cottontails": "images/Cottontails.webp",
    "Nyaninyunyenyon": "images/Nyaninyunyenyon.jpg",
    "Snoopy": "images/Snoopy.jpeg",
    "Pochacco": "images/Pochacco.png",
    "Teddy the Teddy": "images/Teddy the Teddy.webp",
    "The Vaudeville Duo": "images/The Vaudeville Duo .jpeg",
    "Hangyodon": "images/Hangyodon.png",
    "Tuxedosam": "images/Tuxedosam.webp",
    "Zashikibuta": "images/Zashikibuta.jpg"
};


d3.csv("data/sanrio.csv").then(raw => {
    const data = raw.map(d => ({
        year: +d["Year"],
        rank: +d["Rank"],
        character: d["Character Name"] ? d["Character Name"].trim() : ""
    })).filter(d =>
        Number.isFinite(d.year) &&
        Number.isFinite(d.rank) &&
        d.character !== "" &&
        d.year >= 2000
    );

    const years = [...new Set(data.map(d => d.year))].sort((a, b) => a - b);
    const dataByYear = d3.group(data, d => d.year);

    const appearanceCounts = d3.rollup(
        data,
        v => v.length,
        d => d.character
    );

// Only characters that appear in 2000+
    const allCharacters = [...appearanceCounts.keys()]
        .sort((a, b) => {
            const countDiff = appearanceCounts.get(b) - appearanceCounts.get(a);
            return countDiff !== 0 ? countDiff : d3.ascending(a, b);
        });

    console.log("ALL CHARACTERS (2000+):", allCharacters);

    const x = d3.scaleBand()
        .domain(allCharacters)
        .range([0, innerWidth])
        .padding(0.22);

    function podiumHeight(rank) {
        if (rank == null) return 8;      // not in top 10
        return 40 + (11 - rank) * 22;    // rank 1 tallest
    }

    function podiumColor(rank) {
        if (rank === 1) return "#f6c445";
        if (rank === 2) return "#cfd6dd";
        if (rank === 3) return "#d79a5d";
        if (rank == null) return "#f3dce7";
        return "#f5b6d2";
    }

    function textColor(rank) {
        return rank == null ? "#999" : "#6b2d4a";
    }

    yearSlider
        .attr("min", d3.min(years))
        .attr("max", d3.max(years))
        .attr("step", 1)
        .property("value", d3.min(years));

    function updateChart(year) {
        yearLabel.text(year);

        const yearRows = dataByYear.get(year) || [];
        const rankByCharacter = new Map(yearRows.map(d => [d.character, d.rank]));

        const chartData = allCharacters.map(character => {
            const rank = rankByCharacter.get(character);
            return {
                character,
                rank: rank ?? null,
                height: podiumHeight(rank)
            };
        });

        const t = svg.transition().duration(800).ease(d3.easeCubicInOut);

        const groups = g.selectAll(".char-group")
            .data(chartData, d => d.character);

        const groupsEnter = groups.enter()
            .append("g")
            .attr("class", "char-group")
            .attr("transform", d => {
                const px = x(d.character);
                const py = innerHeight - d.height;
                return `translate(${px}, ${py})`;
            });

        // Podium
        groupsEnter.append("rect")
            .attr("class", "podium")
            .attr("width", x.bandwidth())
            .attr("height", d => d.height)
            .attr("rx", 10)
            .attr("fill", d => podiumColor(d.rank))
            .attr("stroke", "#d88cb0")
            .attr("stroke-width", 2);

        // Rank number on podium
        groupsEnter.append("text")
            .attr("class", "rank-text")
            .attr("x", x.bandwidth() / 2)
            .attr("y", d => d.height - 14)
            .attr("text-anchor", "middle")
            .attr("font-size", 22)
            .attr("font-weight", "700")
            .attr("fill", d => textColor(d.rank))
            .text(d => d.rank ?? "");

        // Character image stays in same slot
        groupsEnter.append("image")
            .attr("class", "char-image")
            .attr("x", x.bandwidth() / 2 - imageSize / 2)
            .attr("y", -(imageSize + imageGap))
            .attr("width", imageSize)
            .attr("height", imageSize)
            .attr("opacity", d => d.rank == null ? 0.35 : 1)
            .attr("href", d => imageMap[d.character] || "assets/images/placeholder.png");

        // Character label below podium
        groupsEnter.append("text")
            .attr("class", "char-label")
            .attr("x", x.bandwidth() / 2)
            .attr("y", -(imageSize + imageGap + 12))
            .attr("text-anchor", "middle")
            .attr("font-size", 10)
            .attr("font-weight", "600")
            .attr("fill", "#333")
            .text(d => d.rank != null ? d.character : "");

        const merged = groupsEnter.merge(groups);

        merged.transition(t)
            .attr("transform", d => {
                const px = x(d.character);
                const py = innerHeight - d.height;
                return `translate(${px}, ${py})`;
            });

        merged.select(".podium")
            .transition(t)
            .attr("width", x.bandwidth())
            .attr("height", d => d.height)
            .attr("fill", d => podiumColor(d.rank));

        merged.select(".rank-text")
            .transition(t)
            .attr("x", x.bandwidth() / 2)
            .attr("y", d => d.height - 14)
            .attr("fill", d => textColor(d.rank))
            .text(d => d.rank ?? "");

        merged.select(".char-image")
            .transition(t)
            .attr("x", x.bandwidth() / 2 - imageSize / 2)
            .attr("y", -(imageSize + imageGap))
            .attr("width", imageSize)
            .attr("height", imageSize)
            .attr("opacity", d => d.rank == null ? 0.35 : 1)
            .attr("href", d => imageMap[d.character] || "assets/images/placeholder.png");

        merged.select(".char-label")
            .transition(t)
            .attr("x", x.bandwidth() / 2)
            .attr("y", -(imageSize + imageGap + 12))
            .text(d => d.rank != null ? d.character : "");

        groups.exit().remove();
    }

    updateChart(d3.min(years));

    yearSlider.on("input", function () {
        updateChart(+this.value);
    });
});