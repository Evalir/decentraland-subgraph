import {Address, BigInt} from '@graphprotocol/graph-ts'
import {
  CreateEstate,
  AddLand,
  RemoveLand,
  UpdateOperator,
  Update
} from '../types/EstateRegistry/Estate'
import {Estate, Parcel, Decentraland} from '../types/schema'
import {LANDRegistry} from "../types/LANDRegistry/LANDRegistry";

export function handleCreateEstate(event: CreateEstate): void {
  let id = event.params._estateId.toString()
  let estate = new Estate(id)
  estate.owner = event.params._owner
  estate.metaData = event.params._data
  estate.land = []
  estate.size = 0
  estate.createTransaction = event.transaction.hash
  estate.save()

  let decentraland = Decentraland.load("1")
  if (decentraland == null){
    decentraland = new Decentraland("1")
    decentraland.landCount = 0
    decentraland.estateCount = 0
  }
  let estateLength = decentraland.estateCount
  estateLength = estateLength + 1
  decentraland.estateCount = estateLength
  decentraland.save()
}

export function handleAddLand(event: AddLand): void {
  let id = event.params._estateId.toString()
  let estate = Estate.load(id)
  let lands = estate.land
  lands.push(event.params._landId)
  estate.land = lands
  estate.size = estate.land.length
  estate.save()

  let parcel = Parcel.load(event.params._landId.toHex())
  // Would expect that this isn't needed, but it is here for safety, since failing at block 6,000,000 slows down iterative testing
  // Because if land parcel doesn't exist, we get a crashed node
  if (parcel == null) {
    parcel = new Parcel(event.params._landId.toHex())
    let registry = LANDRegistry.bind(Address.fromString("0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d"))
    let coordinate = registry.decodeTokenId(event.params._landId)
    parcel.x = coordinate.value0
    parcel.y = coordinate.value1
    parcel.owner = estate.owner

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
  parcel.estate = id
  parcel.updatedAt = event.block.timestamp
  parcel.save()
}

export function handleRemoveLand(event: RemoveLand): void {
  let id = event.params._estateId.toString()
  let estate = Estate.load(id)
  let lands = estate.land

  let i = lands.indexOf(event.params._landId)
  lands.splice(i, 1)
  estate.land = lands
  estate.size = estate.land.length
  estate.save()

  let parcel = Parcel.load(event.params._landId.toHex())
  // Would expect that this isn't needed, but it is here for safety, since failing at block 6,000,000 slows down iterative testing
  // Because if land parcel doesn't exist, we get a crashed node
  if (parcel == null) {
    parcel = new Parcel(event.params._landId.toHex())
    let registry = LANDRegistry.bind(Address.fromString("0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d"))
    let coordinate = registry.decodeTokenId(event.params._landId)
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
  parcel.owner = event.params._destinatary
  parcel.lastTransferredAt = event.block.timestamp
  parcel.estate = null
  parcel.updatedAt = event.block.timestamp
  parcel.save()
}


export function handleUpdateOperator(event: UpdateOperator): void {
  let id = event.params._estateId.toString()
  let estate = Estate.load(id)
  estate.operator = event.params._operator
  estate.save()
}

export function handleEstate(event: Update): void {
    let id = event.params._assetId.toHex()
    let estate = Estate.load(id)
    estate.metaData = event.params._data
    estate.save()
}