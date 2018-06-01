


function maxDate(tDate, oDate) {
  return tDate > oDate ? tDate : oDate
}

function minDate(tDate, oDate) {
  return tDate < oDate ? tDate : oDate
}


function getLongestCommonWorkPeriod(entries) {

  let validRangesByCompoundKey = {}

  for (let entry of entries) {
    for (let otherEntry of entries) {
      // if its the same employee or the project is different continue
      if (entry.empID === otherEntry.empID || entry.projectID !== otherEntry.projectID) continue;

      let maxFrom = moment.utc(maxDate(entry.dateFrom, otherEntry.dateFrom))
      let minTo = moment.utc(minDate(entry.dateTo, otherEntry.dateTo))

      // if there is no intersection continue
      if (!(maxFrom < minTo)) continue;

      let compoundKey = `${Math.min(Number(entry.empID), Number(otherEntry.empID))}-${Math.max(Number(entry.empID), Number(otherEntry.empID))}`

      validRangesByCompoundKey[compoundKey] = validRangesByCompoundKey[compoundKey] || []
      let validRanges = validRangesByCompoundKey[compoundKey]
      for (let range of validRanges) {

        let maxFromValidRange = moment.utc(maxDate(maxFrom, range.dateFrom))
        let minToValidRange = moment.utc(minDate(minTo, range.dateTo))

        if (!(maxFromValidRange < minToValidRange)) continue;

        if (maxFrom < range.dateFrom && minTo < range.dateTo) {
          // we are on the left and are not engulefed
          minTo = moment.utc(range.dateFrom)
        } else if (maxFrom > range.dateFrom && minTo > range.dateTo) {
          // we are on the right and are not engulfed
          maxFrom = moment.utc(range.dateTo)
        } else if (maxFrom < range.dateFrom && minTo > range.dateTo) {
          // we are engulfing another range
          range.dateTo = moment.utc(minTo)
          maxFrom = moment.utc(range.dateFrom)
        } else if (maxFrom >= range.dateFrom && minTo <= range.dateTo) {
          // we are engulfed by another range
          maxFrom = null
          minTo = null
          break;
        }
      }
      // if there is no valid intersection continue
      if (!(maxFrom < minTo)) continue;

      validRanges.push({ dateFrom: maxFrom, dateTo: minTo })
    }
  }

  let max = {
    employeeOne: null,
    employeeTwo: null,
    totalDays: 0
  }

  for (let compoundKey in validRangesByCompoundKey) {
    if (!validRangesByCompoundKey.hasOwnProperty(compoundKey)) continue;

    let ranges = validRangesByCompoundKey[compoundKey]
    let days = 0
    for (let range of ranges) {
      days += Math.abs((range.dateFrom.valueOf() - range.dateTo.valueOf()) / (86400000))
    }

    if (days > max.totalDays) {
      let ids = compoundKey.split('-')
      max = {
        employeeOne: ids[0],
        employeeTwo: ids[1],
        totalDays: days
      }
    }
  }

  return max
}

window.onload = () => {
  {
    // let entries = [
    //   {
    //     empID: 1,
    //     projectID: 1,
    //     dateFrom: moment.utc("2017-04-01"),
    //     dateTo: moment.utc("2017-05-10")
    //   },
    //   {
    //     empID: 2,
    //     projectID: 1,
    //     dateFrom: moment.utc("2017-05-01"),
    //     dateTo: moment.utc("2017-06-01")
    //   },
    //   {
    //     empID: 1,
    //     projectID: 2,
    //     dateFrom: moment.utc("2017-05-01"),
    //     dateTo: moment.utc("2017-06-01")
    //   },
    //   {
    //     empID: 2,
    //     projectID: 2,
    //     dateFrom: moment.utc("2017-05-20"),
    //     dateTo: moment.utc("2017-06-01")
    //   }
    // ]

    // console.log(JSON.stringify(entries))
    // console.log(getLongestCommonWorkPeriod(entries))

  }

  if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
    return alert('Please open this example in a browser that supports File APIs.');
  }



  // ReactDOM.render(
  //   React.createElement(Home, {}, null),
  //   document.getElementById('app'))


  document.getElementById('file-input').addEventListener('change', event => {
    let file = event.target.files[0]

    let reader = new FileReader()
    reader.onload = () => {
      let entries = csvToJSON(reader.result)
      let max = getLongestCommonWorkPeriod(entries)

      console.log(max)
    }

    reader.readAsText(file)

  })
}


function csvToJSON(csv) {
  let lines = csv.split('\n')
  let result = []
  let headers = lines[0].split(",")
  for (var i = 1; i < lines.length; i++) {
    let line = lines[i].split(",")
    let obj = {
      empID: Number(line[0]),
      projectID: Number(line[1]),
      dateFrom: moment.utc(line[2]),
      dateTo: (!line[3] || line[3] === 'NULL') ? moment.utc() : moment.utc(line[3])
    }
    result.push(obj)
  }

  return result
}


// class Home extends React.Component {
//   constructor(props) {
//     super(props)
//   }

//   render() {
//     return React.createElement('div', null, `Hello world from react`)
//   }
// }

// class FileInput extends React.Component {
//   constructor(props) {
//     super(props)
//     this.log = this.log.bind(this)
//   }

//   log() {
//     console.log('here')
//   }

//   render() {
//     return React.createElement('input', {}, `Hello world from react`)
//   }
// }