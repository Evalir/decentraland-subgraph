import {
  LANDRegistry,
  Transfer,
  Update,
  UpdateOperator,
  Transfer2
} from '../types/LANDRegistry/LANDRegistry'
import {Decentraland, Parcel, ParcelData} from '../types/schema'

enum CSVState {
  BETWEEN = 0,
  UNQUOTED_VALUE = 1,
  QUOTED_VALUE = 2,
}

/**
 * Parses a CSV string into an array of strings.
 * @param csv CSV string.
 * @returns Array of strings.
 */
function parseCSV(csv: string): Array<string> {
  let values = new Array<string>()
  let valueStart = 0
  let state = CSVState.BETWEEN

  for (let i: i32 = 0; i < csv.length; i++) {
    if (state == CSVState.BETWEEN) {
      if (csv[i] != ',') {
        if (csv[i] == '"') {
          state = CSVState.QUOTED_VALUE
          valueStart = i + 1
        } else {
          state = CSVState.UNQUOTED_VALUE
          valueStart = i
        }
      }
    } else if (state == CSVState.UNQUOTED_VALUE) {
      if (csv[i] == ',') {
        values.push(csv.substr(valueStart, i - valueStart))
        state = CSVState.BETWEEN
      }
    } else if (state == CSVState.QUOTED_VALUE) {
      if (csv[i] == '"') {
        values.push(csv.substr(valueStart, i - valueStart))
        state = CSVState.BETWEEN
      }
    }
  }

  return values
}

// Legacy handles the old transfer with 5 fields
// legacy address: 0xf540a0606498cfcde73f0c8a6276ad44f1930b1a
export function handleLegacyLandTransfer(event: Transfer): void {
  let parcelId = event.params.assetId.toHex()
  let parcel = Parcel.load(parcelId)
  if (parcel == null) {
    parcel = new Parcel(parcelId)
    let registry = LANDRegistry.bind(event.address)
    let coordinate = registry.decodeTokenId(event.params.assetId)
    parcel.x = coordinate.value0
    parcel.y = coordinate.value1

    let decentraland = Decentraland.load("1")
    if (decentraland == null){
      decentraland = new Decentraland("1")
      decentraland.landCount = 0
      decentraland.estateCount = 0
    }
    let landLength = decentraland.landCount
    landLength = landLength + 1
    decentraland.landCount = landLength
    decentraland.save()
  }
  parcel.owner = event.params.to
  parcel.updatedAt = event.block.timestamp
  parcel.lastTransferredAt = event.block.timestamp
  parcel.save()
}

// New LANDRegistry at block 6,240,242
// address : 0x46fbCfd32eA671CAa21897C09072CB6cb44C0bc9
export function handleLandTransfer(event: Transfer2): void {
  let parcelId = event.params.assetId.toHex()
  let parcel = Parcel.load(parcelId)
  if (parcel == null) {
    parcel = new Parcel(parcelId)
    let registry = LANDRegistry.bind(event.address)
    let coordinate = registry.decodeTokenId(event.params.assetId)
    parcel.x = coordinate.value0
    parcel.y = coordinate.value1

    let decentraland = Decentraland.load("1")
    if (decentraland == null){
      decentraland = new Decentraland("1")
      decentraland.landCount = 0
      decentraland.estateCount = 0
    }
    let landLength = decentraland.landCount
    landLength = landLength + 1
    decentraland.landCount = landLength
    decentraland.save()
  }
  parcel.owner = event.params.to
  parcel.updatedAt = event.block.timestamp
  parcel.lastTransferredAt = event.block.timestamp
  parcel.save()
}

export function handleLandUpdate(event: Update): void {
  // Bind LANDRegistry contract
  let registry = LANDRegistry.bind(event.address)

  let parcelId = event.params.assetId.toHex()
  let coordinate = registry.decodeTokenId(event.params.assetId)
  // Create ParcelData entity
  let dataString = event.params.data.toString()
  let dataId = parcelId + '-data'
  let data = new ParcelData(dataId)
  data.parcel = parcelId

  // Parse CSV data
  if (dataString.charAt(0) == '0') {
    let values = parseCSV(dataString)
    if (values.length > 0) {
      data.version = values[0]
    }
    if (values.length > 1) {
      data.name = values[1]
    }
    if (values.length > 2) {
      data.description = values[2]
    }
    if (values.length > 3) {
      data.ipns = values[3]
    }
  } else {
    return // Unsupported version
  }

  data.save()

  // Create Parcel entity
  let parcel = Parcel.load(parcelId)
  if (parcel == null) {
    let parcel = new Parcel(parcelId)
    parcel.x = coordinate.value0
    parcel.y = coordinate.value1
    parcel.data = dataId
    parcel.owner = event.params.holder
    parcel.updatedAt = event.block.timestamp
    parcel.save()

    let decentraland = Decentraland.load("1")
    if (decentraland == null) {
      decentraland = new Decentraland("1")
      decentraland.landCount = 0
      decentraland.estateCount = 0
    }
    let landLength = decentraland.landCount
    landLength = landLength + 1
    decentraland.landCount = landLength
    decentraland.save()
  }
}

// Technical you can assign many operators, as it is just approval for
// another address to trade your ERC721 land token.
export function handleUpdateOperator(event: UpdateOperator):void{
  let parcelId = event.params.assetId.toHex()
  let parcel = Parcel.load(parcelId)
  if (parcel == null) {
    parcel = new Parcel(parcelId)
    let registry = LANDRegistry.bind(event.address)
    let coordinate = registry.decodeTokenId(event.params.assetId)
    parcel.x = coordinate.value0
    parcel.y = coordinate.value1

    let decentraland = Decentraland.load("1")
    if (decentraland == null){
      decentraland = new Decentraland("1")
      decentraland.landCount = 0
      decentraland.estateCount = 0
    }
    let landLength = decentraland.landCount
    landLength = landLength + 1
    decentraland.landCount = landLength
    decentraland.save()
  }

  let operators = parcel.operators
  if (operators == null) {
    operators = []
  }
  operators.push(event.params.operator)
  parcel.updatedAt = event.block.timestamp
  parcel.operators = operators
  parcel.save()

}