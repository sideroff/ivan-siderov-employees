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

  let result = {
    max: {
      employeeOne: null,
      employeeTwo: null,
      totalDays: 0
    },
    entries: []
  }

  for (let compoundKey in validRangesByCompoundKey) {
    if (!validRangesByCompoundKey.hasOwnProperty(compoundKey)) continue;

    let ranges = validRangesByCompoundKey[compoundKey]
    let days = 0
    for (let range of ranges) {
      days += Math.abs((range.dateFrom.valueOf() - range.dateTo.valueOf()) / (86400000))
    }

    let ids = compoundKey.split('-')
    let newEntry = {
      employeeOne: ids[0],
      employeeTwo: ids[1],
      totalDays: days
    }

    result.entries.push(newEntry)

    if (newEntry.totalDays > result.max.totalDays) {
      result.max = newEntry
    }
  }

  return result
}

window.onload = () => {
  if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
    return alert('Please open this example in a browser that supports File APIs.');
  }

  const columns = [
    {
      Header: 'Employee ID #1',
      accessor: 'employeeOne'
    },
    {
      Header: 'Employee ID #2',
      accessor: 'employeeTwo'
    },
    {
      id: 'daysWorked',
      Header: 'Days Worked',
      accessor: 'totalDays'
    }
  ]

  const ReactTable = window.ReactTable.default

  class Home extends React.Component {
    constructor(props) {
      super(props)
      this.onFileChange = this.onFileChange.bind(this)

      this.state = {
        entries: [],
        max: null
      }
    }

    onFileChange(event) {
      let file = event.target.files[0]

      let reader = new FileReader()
      reader.onload = () => {
        let entries = csvToJSON(reader.result)
        let result = getLongestCommonWorkPeriod(entries)

        this.setState({
          entries: result.entries,
          max: result.max
        })
      }

      reader.readAsText(file)
    }

    render() {
      return React.createElement('div', null,
        React.createElement('h2', {}, 'Please choose a csv file.'),
        React.createElement(FileInput, { onChange: this.onFileChange }),
        React.createElement('hr', {}),
        React.createElement('div', {}, this.state.max ? `Maximum time worked together done by employees ${this.state.max.employeeOne} & ${this.state.max.employeeTwo}, they worked for ${this.state.max.totalDays} days together.` : ''),
        React.createElement('hr', {}),
        React.createElement(ReactTable, { data: this.state.entries, columns }),

      )
    }
  }

  class FileInput extends React.Component {
    constructor(props) {
      super(props)
    }

    render() {
      return React.createElement('input', { type: 'file', onChange: this.props.onChange })
    }
  }

  ReactDOM.render(
    React.createElement(Home, {}, null),
    document.getElementById('app'))
}





