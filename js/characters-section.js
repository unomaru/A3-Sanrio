(() => {
    const grid = d3.select("#character-grid");
    const tooltip = d3.select("#tooltip");

    const detailModal = d3.select("#character-detail-modal");
    const detailTitle = d3.select("#detail-title");
    const detailSvg = d3.select("#detail-chart");
    const detailCloseBtn = d3.select("#detail-close-btn");

    const detailWidth = +detailSvg.attr("width");
    const detailHeight = +detailSvg.attr("height");

    const detailMargin = { top: 30, right: 30, bottom: 50, left: 60 };
    const detailInnerWidth = detailWidth - detailMargin.left - detailMargin.right;
    const detailInnerHeight = detailHeight - detailMargin.top - detailMargin.bottom;

    const imageMap = {
        "Hello Kitty": "images/kitty.webp",
        "Little Twin Stars": "images/little twin stars.gif",
        "My Melody": "images/MyMelody.webp",
        "Pompompurin": "images/pompom.png",
        "Cinnamoroll": "images/Cinnamoroll.webp",
        "Kuromi": "images/Kuromi.webp",
        "Pochacco": "images/Pochacco.webp",
        "Bad Badtz-Maru": "images/Bad Badtz.webp",
        "Dear Daniel": "images/Dear Daniel.webp",
        "Tuxedosam": "images/Tuxedosam.webp",
        "Charmmykitty": "images/charmmy.webp",
        "Patty & Jimmy": "images/Patty&Jimmy.webp",
        "Gudetama": "images/gudetama.png",
        "Sugarbunnies": "images/Sugarbunnies.webp",
        "Yoshikitty": "images/yoshi.png",
        "SHOW BY ROCK!!": "images/show.png",
        "U*Sa*Ha*Na": "images/Usahana.png",
        "Corocorokuririn": "images/Corocorokuririn.webp",
        "GOEXPANDA": "images/GOEXPANDA.webp",
        "Hangyodon": "images/hangyodon.webp",
        "Jewelpet": "images/jewel.png",
        "KIRIMI-chan": "images/kirimi.png",
        "Kerokerokeroppi": "images/Keroppi.webp",
        "Cogimyun": "images/Cogimyun.png",
        "Fuku-chan": "images/Fuku.webp",
        "ShinganCrimsonZ": "images/shingan.webp",
        "Bonbonribbon": "images/Bonbon.webp",
        "Chibimaru": "images/Chibimaru.webp",
        "Chocopanda": "images/Choco.webp",
        "Cinnamoangels": "images/CinnaAngels.webp",
        "Marshmallowmitainafuwafuwanyanko": "images/Marsh.webp",
        "Minna no Tābō": "images/Minna no Tabo.webp",
        "Mocha": "images/Mocha.webp",
        "Muffin": "images/muffin.webp",
        "Okigaru Friends": "images/Okigaru.webp",
        "Plasmagica": "images/plasmagica.webp",
        "Sweetcoron": "images/Sweetcorn.webp",
        "Taraiguma no Landry": "images/tarai.webp",
        "Trichronika": "images/Trichronika.webp",
        "Tsurezure Naru Ayatsuri Mugenan": "images/Tsurezure.webp",
        "Turfy": "images/Turfy.webp"
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
            d.year >= 2000 &&
            d.year <= 2024
        );

        const grouped = d3.group(data, d => d.character);

        const characterStats = Array.from(grouped, ([character, rows]) => {
            const ranks = rows.map(d => d.rank);
            const years = rows.map(d => d.year).sort((a, b) => a - b);

            return {
                character,
                appearances: rows.length,
                bestRank: d3.min(ranks),
                worstRank: d3.max(ranks),
                firstYear: d3.min(years),
                lastYear: d3.max(years),
                image: imageMap[character] || "images/placeholder.png"
            };
        }).sort((a, b) => {
            if (b.appearances !== a.appearances) return b.appearances - a.appearances;
            return d3.ascending(a.character, b.character);
        });

        const cards = grid.selectAll(".character-card")
            .data(characterStats)
            .join("div")
            .attr("class", "character-card")
            .on("mouseover", function(event, d) {
                tooltip
                    .classed("hidden", false)
                    .html(`
                        <strong>${d.character}</strong><br>
                        Ranked appearances: ${d.appearances}<br>
                        Highest rank: #${d.bestRank}<br>
                        Lowest rank: #${d.worstRank}<br>
                        First ranked year: ${d.firstYear}<br>
                        Last ranked year: ${d.lastYear}
                    `);
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("left", `${event.pageX + 12}px`)
                    .style("top", `${event.pageY + 12}px`);
            })
            .on("mouseout", function() {
                tooltip.classed("hidden", true);
            })
            .on("click", function(event, d) {
                cards.classed("selected", false);
                d3.select(this).classed("selected", true);
                tooltip.classed("hidden", true);
                drawDetailChart(d.character, data);
            });;

        cards.append("img")
            .attr("src", d => d.image)
            .attr("alt", d => d.character);

        cards.append("div")
            .attr("class", "character-name")
            .text(d => d.character);

        function drawDetailChart(character, allData) {
            detailModal.classed("hidden", false);
            detailTitle.text(`${character} Ranking History (2000–2024)`);

            const years = d3.range(2000, 2025);

            const characterRows = allData.filter(d => d.character === character);
            const rankByYear = new Map(characterRows.map(d => [d.year, d.rank]));

            const series = years.map(year => ({
                year,
                rank: rankByYear.has(year) ? rankByYear.get(year) : null
            }));

            detailSvg.selectAll("*").remove();

            const g = detailSvg.append("g")
                .attr("transform", `translate(${detailMargin.left},${detailMargin.top})`);

            const x = d3.scaleLinear()
                .domain([2000, 2024])
                .range([0, detailInnerWidth]);

            const y = d3.scaleLinear()
                .domain([10, 1])
                .range([detailInnerHeight, 0]);

            const xAxis = d3.axisBottom(x)
                .tickValues([2000, 2005, 2010, 2015, 2020, 2024])
                .tickFormat(d3.format("d"));

            const yAxis = d3.axisLeft(y)
                .tickValues(d3.range(1, 11))
                .tickFormat(d => `#${d}`);

            g.append("g")
                .attr("transform", `translate(0,${detailInnerHeight})`)
                .call(xAxis);

            g.append("g")
                .call(yAxis);

            const line = d3.line()
                .defined(d => d.rank !== null)
                .x(d => x(d.year))
                .y(d => y(d.rank));

            g.append("path")
                .datum(series)
                .attr("fill", "none")
                .attr("stroke", "#e7549d")
                .attr("stroke-width", 3)
                .attr("d", line);

            g.selectAll(".point")
                .data(series.filter(d => d.rank !== null))
                .join("circle")
                .attr("cx", d => x(d.year))
                .attr("cy", d => y(d.rank))
                .attr("r", 4)
                .attr("fill", "#e7549d");
        }

        detailCloseBtn.on("click", function () {
            detailModal.classed("hidden", true);
        });

        detailModal.on("click", function (event) {
            if (event.target === this) {
                detailModal.classed("hidden", true);
            }
        });
    });
})();