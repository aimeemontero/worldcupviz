// Data read from file
let countryNames;

// Global variable for resizing strikers chart
let xStriker;   // x scale
let xAxisStriker; // x axis
let sel_striker_value = 'Goals';

// Global variable for resizing stats chart
let xStats;
let xAxisStats;

// Global variable for resizing squads chart
let xSquads;
let xAxisSquads;
const nbCol = 3;

// Color scale for treemap
const color = d3.scaleLinear()
              .domain([0,1])
              .range(["#edf8fb","#238b45"]);

const years =['1930','1934','1938','1950','1954','1958','1962','1966','1970','1974',
              '1978','1982','1986','1990','1994','1998','2002','2006','2010','2014']


let CURRENT_COUNTRY = 'BRA'
let CURRENT_YEAR = '2014'

go()

function go(countrycode='BRA', year='1994'){

  d3.csv("data/teams.txt", function(error, data) {

    //  Alphabetically
    data.sort((a, b) => a.name.substring(3,) < b.name.substring(3,) ? -1 :
                        a.name.substring(3,) > b.name.substring(3,) ? 1 : 0)
    countryNames = data;
    //Build a title
    title(countrycode);
    // Build a list of country
    create_list_countries();
    // Build a bar chart of ccode
    stats_chart(countrycode);
    // Build a list of nearest matches of ccode
    matches_result(countrycode, year);
    // Build a list of top trikers
    top_striker(countrycode);
    //Build a tree map
    treemap(countrycode)
    // Build a sumary over all participated years
    squad(countrycode, year)
  });
}


function title(ccode) {
    let name = countryNames.filter(x => x.name.substring(0,3)==ccode)
                           .map(x => x.name.substring(3,))[0]
    d3.select('#title')
      .style("font-size", "50px")
      .text(`${name} at the FIFA WORLD CUP`);
}


/*
  Create a clickable list of all countries that have participated on FIFA WC
*/
function create_list_countries() {
  const countryDiv = document.getElementById('11')

  let names = [];
  let name ;
  for (i = 0 ; i < countryNames.length; i++) {
    name = countryNames[i].name;
    names[i] = name.substring(3, name.length);
  }


  let ol = d3.select(countryDiv)
             .append('ol')
             .attr('id','ol')
             .attr('class', 'ol');

	ol.selectAll('li')
	     .data(names)
	     .enter()
	     .append('li')
       .attr('id', (d,i) => names[i])
             .append('a')
             .attr('href', 'javascript: return false;')
             .attr('class', 'list-group-item')
             .html((d, i) => d)
             .on('click', (d, i) => {
               ccode = countryNames[i].name.substring(0, 3);
               title(ccode);
               stats_chart(ccode);
               matches_result(ccode, '2014');
               top_striker(ccode);
               treemap(ccode);
               squad(ccode, '2014');
             });
}

function searchCountry() {
    const input = document.getElementById('countryInput');
    const filter = input.value.toUpperCase();
    const ol = document.getElementById("ol");
    let li = ol.getElementsByTagName('li');
    // Loop through all list items, and hide those who don't match the search query
    for (i = 0; i < li.length; i++) {
        let a = li[i].getElementsByTagName("a")[0];
        if (a.innerHTML.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }
    }
}


/*
  A func that draw stats chart
*/

function stats_chart(ccode){

  let ycards  = [];
  let rcards  = [];
  let goals   = [];
  let goalsA  = [];
  let points  = [];
  let attendances = [];
  let records = [];

  const chartDiv = document.getElementById('12');
  const margin = {top: 30, right: 10, bottom: 50, left: 60};
  const width  = chartDiv.clientWidth  - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  // Remove chart if it exists
  d3.select('#svg_barchart').remove();

  d3.select('#title_barchart')
    .attr('class', 'intro_text')
    .text('Statistics');

  let svg = d3.select(chartDiv)
                .append("svg")
                .attr('width', width  + margin.left + margin.right )
                .attr('height',height + margin.top  + margin.bottom )
                .attr("id","svg_barchart")
                .append('g')
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  // Read data
  d3.json("data/team_statistics.json", function(error, data) {
    const yearsParticipated = d3.keys(data[ccode]);
    let team_data = data[ccode];
    for (let i = 0 ; i < years.length ; i++) {
        let year = years[i];
        if (team_data[year] == null) {
          ycards[i]      = 0;
          rcards[i]      = 0;
          goals[i]       = 0;
          goalsA[i]      = 0;
          points[i]      = 0;
          attendances[i] = 0;

        } else {
          let year_team_data = team_data[year];
          team_cards = year_team_data['teamcards'];
          team_goals = year_team_data['teamgoals'];
          matches    = year_team_data['matches'];
          team_age   = year_team_data['squads'];

          if (team_cards.length == 0) {
              rcards[i] = 0;
              ycards[i] = 0;
          } else {
              rcards[i] = team_cards[0][0];
              ycards[i] = team_cards[0][1];
          }
          if (team_goals.length == 0) {
              goals[i]  = 0;
              goalsA[i] = 0;
          } else {
              goals[i]  = team_goals[0][0]
              goalsA[i] = team_goals[0][1]
          }
          let attendance = 0;
          let point = 0;
          // Number of point: win = 3pts, draw = 1pt, lose = 0pt.
          for (k = 0 ; k < matches.length ; k++) {
              const match = matches[k];
              const att = parseInt(match[0])
              attendance += att;

              const away_code  = match[1];
              const home_code  = match[7];
              const away_score = parseInt(match[2]);
              const home_score = parseInt(match[8]);
              if ((home_code == ccode & home_score > away_score) ||
                  (away_code == ccode & away_score > home_score)) {
                point += 3;
              } else if (away_score==home_score) {
                  const pen = match[10];
                  if (pen == '')
                    point += 1;
                  else {
                    const scores = pen.split('-');
                    const home_score = parseInt(scores[0]);
                    const away_score = parseInt(scores[1]);
                    if ((home_code == ccode & home_score > away_score) ||
                        (away_code == ccode & away_score > home_score)) {
                          point += 3;
                    }
                  }
              }
          }
          points[i] = point;
          attendances[i] = parseInt(attendance/matches.length);
        }
    }
    let Data = []


    for (let i = 0 ; i < years.length ; i++) {
      let dict = {};
      dict['Year'] = years[i];
      dict['Goals per WC'] = goals[i];
      dict['Yellow cards per WC'] = ycards[i];
      dict['Red cards per WC'] = rcards[i];
      dict['Goals agaist per WC'] = goalsA[i];
      dict['Points per WC'] = points[i];
      dict['Avg attendances per match'] = attendances[i];
      Data.push(dict);
    }


    const choices = Object.keys(Data[0]).filter( d => d != 'Year');
    let choice = choices[0];

    let yStats = d3.scaleLinear()
                   .domain([0, d3.max(Data, (d, i) => d[choice])])
			             .range([height, 0]);

  	xStats = d3.scaleBand()
		           .domain(years)
		           .rangeRound([0, width]);

    xAxisStats = d3.axisBottom(xStats);
    let yAxisStats  = d3.axisLeft(yStats);

    svg.append("g")
       .attr("class", "xStats")
       .attr('id', 'xStats')
       .attr("transform", "translate(0," + height + ")")
       .call(xAxisStats)
       .selectAll("text")
       .style("font-size", "14px")
       .style("text-anchor", "end")
       .attr("dx", "-.7em")
       .attr("dy", ".5em")
       .attr("transform", "rotate(-45)")
       //.attr("dx", "-.8em")
       //.attr("dy", "-.5em")
       //.attr("transform", "rotate(-90)")
       .attr('fill', (d, i) => (yearsParticipated.includes(d) ? color(.75) : 'black'))
       .on('click',(d, i) => {
                                matches_result(ccode, d);
                                squad(ccode, d);
                              });


    svg.append("g")
       .attr('class', "yStats")
       .call(yAxisStats)
       .style("font-size", "14px");

    svg.selectAll("somethings")
       .data(Data)
       .enter()
       .append("rect")
       .attr("class","rect_stats")
       .attr("width", width/Data.length - 1)
       //.attr("height",(d, i) => 0)//height - yStats(d[choice])) // function(d){return height - y(+d[choice]);}
       .attr("x",     (d, i) => (width/Data.length) * i )
       //.attr("y",     (d, i) => yStats(+d[choice]))

       .on('click',  (d, i) => {
                                  matches_result(ccode, d.Year);
                                  squad(ccode, d.Year);
                               })
       .append("title")
          .text((d, i) => d.Year + " : " + d[choice])




    svg.selectAll('.rect_stats')
                     .data(Data)
                     .transition()
                     .duration(700)
                     .attr('height',(d, i) => height - yStats(d[choice]))
                     .attr("y",     (d, i) => yStats(+d[choice]))
/**/

    d3.select("#dropdown_chart").remove();
    let selector = d3.select("#drop")
                     .append("select")
                  	 .attr("id","dropdown_chart")
                     .on("change", (d, i) => {

                                 	choice = document.getElementById("dropdown_chart");
                            	    //yStats.domain([0, d3.max(Data, function(d){
                    				      //return +d[choice.value];})]);
                                  yStats.domain([0, d3.max(Data, (d, i) => d[choice.value])]);
                                  yAxisStats.scale(yStats);
                                  d3.selectAll(".yStats")
                                    .transition()
                                    .call(yAxisStats);


                                  d3.selectAll(".rect_stats")
                                    .attr("x",      (d, i) => (width / Data.length) * i)
                                    .transition()
                                    .duration(700)
                                    .attr("y",      (d, i) => yStats(d[choice.value]))
                                    .attr("height", (d, i) => height - yStats(d[choice.value]))
                                    .select("title")
                                    .text((d, i) => d.Year + " : " + d[choice.value]);

                                  resize_stats();
                      });

     selector.selectAll("option")
             .data(choices)
             .enter()
             .append("option")
             .attr("value", (d, i) => d)
             .text((d, i) => d)
});
}


function resize_stats() {
    const margin = {top: 30, right: 10, bottom: 50, left: 60};
    const chartDiv = document.getElementById('12');

    //Get the width of the window
    const new_width = chartDiv.clientWidth - margin.right - margin.left;
    //Change the width of the svg
    d3.select("#svg_barchart")
      .attr("width", chartDiv.clientWidth);

    // re-scale x axis
    xStats.rangeRound([0, new_width]);
    // set new x position and new width for each rect
    d3.selectAll('.rect_stats')
      .attr('width', (d, i) => new_width/years.length - 1)
      .attr("x", (d, i) =>    new_width/years.length * i );

    xAxisStats.scale(xStats);
    d3.select('.xStats')
      .call(xAxisStats)

}


/*
Build a list of matches result of countrycode for a specific year
*/

function matches_result(countrycode, year) {
  let countryname = countryNames.filter(x => x.name.substring(0,3)==countrycode)
                         .map(x => x.name.substring(3,))[0]

  const resultDiv = document.getElementById('2');
  const margin = {top: 30, right: 30, bottom: 30, left: 30};
  const width  = resultDiv.clientWidth  - margin.left - margin.right;
  //let height = 460 - margin.top - margin.bottom;
  // Remove chart if it exists
  d3.select('#svg_result').remove();

  // Read data
  let dict = []
  let dict_matches = []

  d3.json("data/team_statistics.json", function(error, data) {

    // latest year participated
    if (data[countrycode][year] == null) {
      const yearsParticipated = d3.keys(data[countrycode]);
      year = yearsParticipated[yearsParticipated.length-1];
    }
    d3.select('#title_result')
      .attr('class', 'intro_text')
      .text('Results at '+year);

    const matches = data[countrycode][year]['matches'];
    matches.map(x => {dict.push({
                          'Attendance': x[0], 'AwayCode' : x[1], 'AwayScore': x[2], '-' : '-',
                          'AwayTeam'  : x[3], 'City'     : x[4], 'Date'     : x[5], 'Description': x[6],
                          'HomeCode'  : x[7], 'HomeScore': x[8], 'HomeTeam' : x[9], 'MatchReport': x[11] })});


    let columns =  ['Date','City','Description','HomeTeam','HomeScore','-','AwayScore','AwayTeam'];
    let columnsSpace = [.1,.2,.2,.15,.09,.02,.09,.15];

    let table = d3.select(resultDiv)
                  .append('table')
                  .attr('id','svg_result')
                //  .attr('style', 'margin-top:'+ 50 +'px');

    let space =   table.selectAll('something')
                       .data(columnsSpace)
                       .enter()
                       .append('col')
                       .attr('class', 'table_result')
                       .attr('width', (d, i) =>  d*width);

    let	rows =  table.selectAll('tr')
                     .data(dict)
                     .enter()
                        .append('tr')
                        .attr('id',(d,i) => 'row'+i)
                        .on('click', (d, i) => window.location.assign(d.MatchReport))

    let cells = rows.selectAll('td')
                    .data(
                      function(row) {
                                return columns.map(
                                  function(column) {
                                      return {column: column, value: row[column]};
                                  });
                          }
                    )
                     .enter()
                         .append('td')
                         .attr('height', 40)
                         .html((d,i) => {
                                          column = d.column
                                          value = d.value

                                          if (value == countryname)
                                            return value.bold()
                                          return value
                                  })

    d3.select('#penaltyExplain').remove()
    let penaltyExplain = d3.select(resultDiv)
                           .append('div')
                           .attr('align','center')
                           .attr('id', 'penaltyExplain')
                           .append('text')
                           .style("font-style", 'italic')
                           .text('Penalty shoot-outs are indicated in ( )');


 });

}


function resize_result(){
  //let columnsSpace = [.1,.2,.2,.15,.09,.02,.09,.15];
  const resultDiv = document.getElementById('2');

  const margin = {top: 30, right: 30, bottom: 30, left: 30};
  const new_width  = resultDiv.clientWidth  - margin.left - margin.right;

  // define new space between columns
  d3.selectAll('.table_result')
    .attr('width', (d, i) =>  d*new_width);
}



function top_striker(countrycode){
  const countryname = countryNames.filter(x => x.name.substring(0,3)==countrycode)
                         .map(x => x.name.substring(3,))[0]
  const trikerDiv = document.getElementById('3');
  const margin = {top: 30, right: 30, bottom: 30, left: 150};
  const width  = trikerDiv.clientWidth  - margin.left - margin.right;

  //Remove chart if it exists
  d3.select('#svg_striker').remove();
  d3.select('#strikerExplain').remove();

  // Read data
  let dict = []

  d3.json("data/team_statistics.json", function(error, data) {

    d3.select('#title_striker')
      .attr('class', 'intro_text')
      .text('Top greatest strikers of all time');


    const yearsParticipated = d3.keys(data[countrycode]);
    let dict_trikers = {}


    for (let i = 0 ; i < yearsParticipated.length ; i++) {
      const players = data[countrycode][yearsParticipated[i]]['playergoals']
      for (j = 0 ; j < players.length ; j++){
          const name    = players[j][0]
          const goals   = players[j][1]
          const matches = players[j][2]
          // dict_trikers key: name, value: [# goals, # matches played]
          if (name in dict_trikers){
            tuple = dict_trikers[name]
            dict_trikers[name] = [tuple[0] + goals, tuple[1]+ matches]
          } else {
            dict_trikers[name] = [goals, matches]
          }
      }
    }

    let top_ten_strikers = d3.keys(dict_trikers).sort(function(a, b) {
        return dict_trikers[b][0] - dict_trikers[a][0];
    })

    if (top_ten_strikers.length > 10)
      top_ten_strikers = top_ten_strikers.slice(0,10);

    let dict = []

    const height = 10*60 - margin.top - margin.bottom;

    top_ten_strikers.map(x => dict.push({'Player' : x, 'Goals': dict_trikers[x][0], 'Ratios': dict_trikers[x][0]/dict_trikers[x][1]}));

    if (top_ten_strikers.length == 0) {

      let strikerExplain = d3.select(trikerDiv)
                             .append('div')
                             .attr('align','center')
                             .attr('id', 'strikerExplain')
                             .append('text')
                             .style("font-style", 'italic')
                             .text('This team have not scored yet :(');
    }

    let yStriker = d3.scaleLinear()
			               .domain([0, 10])
			               .range([0, height]);

  	xStriker = d3.scaleLinear()
			        .domain([0, d3.max(dict.map(x => x.Goals))])
			        .range([0, width]);


    xAxisStriker     = d3.axisBottom(xStriker);
    let yAxisStriker = d3.axisLeft(yStriker)
                         .tickFormat((d, i) => (top_ten_strikers[i]))
                         .tickSize(0)
                        // .tickPadding(10);


    let svg  = d3.select(trikerDiv)
                 .append('svg')
                 .attr('width', width  + margin.left + margin.right)
                 .attr('height',height + margin.top  + margin.bottom)
                 .attr("id","svg_striker")
                 .append('g')
                 .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    svg.append("g")
       .attr("class", "xStriker")
       .attr("transform", "translate(0," + height + ")")
       .call(xAxisStriker)
       .selectAll("text")
       .style("font-size", "14px")
       .style("text-anchor", "end")



    svg.append("g")
       .attr("class", "yStriker")
       .attr("transform", "translate(0, 10)")
       .call(yAxisStriker)
       .selectAll("text")
       .call(wrap, 100)
       .style("font-size", "14px");

    const barHeight = 30;
    let chart = svg.append('g')
                   //.attr('transform', trans)
                   .attr('id', 'hbars')
                   .selectAll('something')
                   .data(dict)
                   .enter()
                   .append('rect')
                      .attr("class","rect_strikers")
                      .attr('height', barHeight)
                      .attr('width', 0)//(d, i) => xStriker(d.Goals))
                      .attr('x', 0)
                      .attr('y', (d, i) => yStriker(i));


     let transit = svg.selectAll('.rect_strikers')
                      .data(dict)
                      .transition()
                      .duration(500)
                      .attr('width', (d, i) => xStriker(d.Goals))
/**/

     let transitText = d3.select('#hbars')
                         .selectAll('something')
                         .data(dict)
                         .enter()
                         .append('text')
                         .attr('class', 'text_striker')
                         //.attr('class', 'text')
                         .attr('x', (d, i) => xStriker(d.Goals)-25)
                         .attr('y', (d, i) => yStriker(i)+20)
                         .text((d,i) => d.Goals)

    const choices = ['Goals', 'Ratio goal per match']
    d3.select("#dropdown_striker").remove();

    let selector = d3.select("#drop_striker")
                     .append("select")
                     .attr("id","dropdown_striker")
                     .on("change", (d, i) => {
                                  const choice = document.getElementById("dropdown_striker");
                                  sel_striker_value = choice.value
                                  const new_data = dict.map(x => (choice.value == 'Goals') ? x.Goals : x.Ratios)
                                  const maxDomain = d3.max([1, d3.max(new_data)])
                                  xStriker.domain([0, maxDomain]);
                                  d3.select(".xStriker")
                                    .transition()
                                 		.call(xAxisStriker)
                                    .selectAll("text")
                                    .style("font-size", "14px")
                                    .style("text-anchor", "end");

                                  d3.selectAll(".rect_strikers")
                                    .transition()
                                    .duration(1000)
                                      .attr('height', barHeight)
                                      .attr('width', (d, i) => xStriker(new_data[i]))
                                      .attr('x', 0)
                                      .attr('y', (d, i) => yStriker(i));

                                 d3.selectAll('.text_striker')
                                   .transition()
                                   .attr('x', (d, i) => xStriker(new_data[i])-35)
                                   .attr('y', (d, i) => yStriker(i)+20)
                                   .text((d,i) => parseFloat(Number(new_data[i]).toFixed(2)))
                     })

     selector.selectAll("something")
             .data(choices)
             .enter()
             .append("option")
             .attr("value", (d, i) => d )
             .text((d, i) => d);
  })
}


function resize_striker(){

    const margin = {top: 30, right: 30, bottom: 30, left: 200};
    const strikerDiv = document.getElementById('3');
    const new_width = strikerDiv.clientWidth;

    //Change the width of the svg
    d3.select("#svg_striker")
      .attr("width", new_width);

    xStriker.range([0, new_width - margin.right - margin.left]);

    d3.selectAll('.rect_strikers')
      .attr('width', (d,i) => (sel_striker_value=='Goals') ? xStriker(d.Goals) : xStriker(d.Ratios))

    d3.select('.xStriker')
      .call(xAxisStriker)


    d3.selectAll('.text_striker')
       .attr('x', (d, i) => (sel_striker_value=='Goals') ? xStriker(d.Goals) - 35 : xStriker(d.Ratios) - 35)

}


function treemap(countrycode){
  let countryname = countryNames.filter(x => x.name.substring(0,3)==countrycode)
                         .map(x => x.name.substring(3,))[0]

  d3.select('#title_treemap')
    .text(`Winning percentage of ${countryname} versus opponent`);

  d3.json("data/team_statistics.json", function(error, data) {

    const yearsParticipated = d3.keys(data[countrycode]);
    let matches = []
    yearsParticipated.map(year => matches.push(data[countrycode][year]['matches']));
    matches = [].concat.apply([], matches); // Flatten list

    // temp, key: team , value: [#wins , #matches]
    let temp = {}

    for (i = 0 ; i < matches.length ; i++) {
      const match = matches[i]
      const homecode  = match[7]
      let homescore = match[8].toString()
      let hometeam  = match[9]
      let awayscore = match[2].toString()
      let awayteam  = match[3]

      if (hometeam != countryname ) { // This country (in argument) is always hometeam
          const temp1 = hometeam
          const temp2 = homescore
          hometeam  = awayteam
          homescore = awayscore
          awayteam  = temp1
          awayscore = temp2
      }
      let a = 0;
      if (homescore.includes('(')) { // contain penalty score which is not count because they draw in 90 mins

      }  else if (parseInt(homescore) > parseInt(awayscore)) { // win
            a = 1;
      } else { // lose and draw => nothing to do

      }

      if (awayteam in temp){
          tuple = temp[awayteam]
          temp[awayteam] = [tuple[0] + a, tuple[1] + 1]
      } else {
          temp[awayteam] = [a, 1]
      }
    }

    const keys = d3.keys(temp)
    let data_treemap = []
    keys.map(x => data_treemap.push({
                                    'name': (parseFloat(Number(temp[x][0]/temp[x][1]*100)).toFixed(0) + '% ' + x),
                                    'size': temp[x][1]
                                  }))

    let tree = {'name': 'tree', 'children': data_treemap}
    let sum   = (d, i) => d.size
    let format = d3.format(",d");


    let x = d3.scaleLinear()
              .domain([0, 100])
              .range([0, 100]);
    let y = d3.scaleLinear()
              .domain([0, 100])
              .range([0, 100]);

    let treemap = d3.treemap()
                    .size([100, 100])
                    .tile(d3.treemapResquarify)
                    .round(false)
                    .paddingInner(0);


    let nodes= d3.hierarchy(tree)
                 .eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
                 .sum(sum)
                 .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

    treemap(nodes);

    let chart = d3.select("#treemap");
    let cell  = chart.selectAll('somethings')
                     .data(nodes.leaves())
                     .enter()
                     .append('div')
                     .attr("class", (d, i) => "node level-" + d.depth)
                     .attr("title", (d, i) => d.data.name.split(' ')[1] + "\n" + 'Number of match(es) played: '+ format(d.value));

    cell.style("left",  (d, i) => x(d.x0) + "%")
	      .style("top",   (d, i) => y(d.y0) + "%")
	      .style("width", (d, i) => x(d.x1 - d.x0) + "%")
	      .style("height",(d, i) => y(d.y1 - d.y0) + "%")
	      .style("background-color", (d, i) => color(parseInt(d.data.name.split('%')[0])/100))
        .append("text")
        .text((d, i) => { text = d.data.name.split(' ');
                          return text[1] + '\n' + text[0]});
  });

}

function resize_squad(){
    const margin = {top: 30, right: 30, bottom: 30, left: 30};
    const squadDiv = document.getElementById('5');

    //Get the width of the window
    const new_width = squadDiv.clientWidth - margin.right - margin.left;

    //Change the width of the svg
    d3.select("#svg_squad")
      .attr("width", new_width + margin.right + margin.left);


    xSquads.range([0, new_width]);

    d3.selectAll('.rect_squads')
      .attr('width', (d,i) => (new_width)/nbCol - 10)
      .attr('x', (d, i) => xSquads(i%nbCol))

    d3.selectAll('.playername')
      .attr('x', (d, i) => xSquads(i%nbCol)+ 20)
      .attr('font-size', (d, i) => (new_width)/nbCol/19 )

    d3.selectAll('.playerpos')
      .attr('x', (d, i) => xSquads(i%nbCol)+ 20)
      .attr('font-size', (d, i) => (new_width)/nbCol/23 )

    d3.selectAll('.playerage')
      .attr('x', (d, i) => xSquads(i%nbCol)+ 20)
      .attr('font-size', (d, i) => (new_width)/nbCol/23 )

    //AxisGroupQuads.call(xAxisSquads)
    xAxisSquads.scale(xSquads)
    /*
    d3.selectAll('.text_striker')
       .attr('x', (d, i) => {   if (sel_striker_value=='Goals')
                                    return xScale(d.Goals) - 25
                                else
                                    return xScale(d.Ratios) - 25
                            })
                            */
}

function squad(countrycode, year) {

  const countryname = countryNames.filter(x => x.name.substring(0,3)==countrycode)
                         .map(x => x.name.substring(3,))[0]
  const squadDiv = document.getElementById('5')
  const margin = {top: 30, right: 30, bottom: 30, left: 30};
  const width = squadDiv.clientWidth - margin.left - margin.right

  //Remove chart if it exists
  d3.select('#svg_squad').remove();


  // Read data
  let dict = []

  d3.json("data/team_statistics.json", function(error, data) {

    const yearsParticipated = d3.keys(data[countrycode]);

    if (data[countrycode][year] == null) {
      year = yearsParticipated[yearsParticipated.length-1];
    }

    d3.select('#title_squad')
      .attr('class', 'intro_text')
      .text(`Squad at ${year}`);

    const squad = data[countrycode][year]['squads'];
    let players_data = []

    squad.map(x => players_data.push({'Player' : x[1], 'DOB' : x[0], 'Position' : x[2]}))

/*
    var xSquads;
    var AxisGroupQuads;
    var transitQuads;
    var xAxisSquads;

*/
    const divHeight = 85;
    const divWidth  = width / nbCol ;
    const height = (players_data.length / nbCol + nbCol) * divHeight - margin.bottom - margin.top
    let ySquads = d3.scaleLinear()
			        .domain([0, players_data.length / nbCol + 1])
			        .range([0, height]);

  	xSquads = d3.scaleLinear()
                    .domain([0, nbCol])
                    .range([0, width]);


    xAxisSquads     = d3.axisBottom(xSquads);
    let yAxisSquads = d3.axisLeft(ySquads)
                        .tickSize(0)
                        .tickPadding(5)


    let svg  = d3.select(squadDiv)
                 .append('svg')
                 .attr('width', width  + margin.left + margin.right)
                 .attr('height',height + margin.top  + margin.bottom)
                 .attr("id","svg_squad")
                 .append('g')
                 .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    svg.append("g")
       .attr("class", "xSquad")
       .attr("transform", "translate(0," + height + ")")

    svg.append("g")
       .attr("class", "ySquad")
       .attr("transform", "translate(0, 10)")

    svg.append('g')
                   //.attr('transform', trans)
                   //.attr('class', 'hbars')
                   .selectAll('somethings')
                   .data(players_data)
                   .enter()
                   .append('rect')
                      .attr("class", (d,i) => (d.Position)=='Coach' ? 'rect_squads Coach' : 'rect_squads Player')
                      .attr('height', divHeight - 5)
                      .attr('width', divWidth - 10 )
                      .attr('x', (d, i) => xSquads(i%nbCol))
                      .attr('y', (d, i) => { i -= i%nbCol; return ySquads(i/nbCol) })
                      .attr('rx', 30);


     let playerName = svg.selectAll('something')
                         .data(players_data)
                         .enter()
                         .append('text')
                           .text((d, i) => (d.Player))
                           .attr('class', 'playername')
                        //   .attr('class', 'text')
                           .attr('font-size', (d, i) => divWidth/19)
                           .attr('x', (d, i) => xSquads(i%nbCol) + 20)
                           .attr('y', (d, i) => { i -= i%nbCol; return ySquads(i/nbCol) + 20})



     let playerAge = svg.selectAll('something')
                         .data(players_data)
                         .enter()
                         .append('text')
                           .text((d, i) => d.DOB)
                           .attr('class', 'playerage')
                      //     .attr('class', 'text')
                           .attr('font-size', (d, i) => divWidth/23)
                           .attr('x', (d, i) => xSquads(i%nbCol) + 20)
                           .attr('y', (d, i) => { i -= i%nbCol; return ySquads(i/nbCol) + 45})


     let playerPos = svg.selectAll('something')
                         .data(players_data)
                         .enter()
                         .append('text')
                           .text((d, i) => d.Position)
                           .attr('class', 'playerpos')
                        //   .attr('class', 'text')
                           .attr('font-size', (d, i) => divWidth/23)
                           .attr('x', (d, i) => xSquads(i%nbCol) + 20)
                           .attr('y', (d, i) => { i -= i%nbCol; return ySquads(i/nbCol) + 65})



   })
}

d3.select(window).on("resize", (d, i) => {
                                              resize_stats();
                                              resize_striker();
                                              resize_result();
                                              resize_squad();
                                         });
d3.select(window).on('reload', (d, i) => console.log('true'))

function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}
