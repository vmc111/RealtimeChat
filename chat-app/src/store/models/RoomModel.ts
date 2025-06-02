import { makeAutoObservable } from 'mobx'

import type { Room, RoomMemberType } from '../../types'

class RoomModel {
  readonly id: string
  private _name: string
  private _description: string
  readonly createdAt: Date
  readonly createdBy: string
  readonly createdByDisplayName: string
  readonly isPrivate: boolean
  private _members: RoomMemberType[]
  private _updatedAt: Date
  private _displayName: string

  constructor(input: Room) {
    this.id = input.id
    this._name = input.name
    this._description = input.description || ''
    this.createdAt = input.createdAt
    this.createdBy = input.createdBy
    this.createdByDisplayName = input.createdByDisplayName || ''
    this.isPrivate = input.isPrivate
    this._members = input.members
    this._updatedAt = input.updatedAt || new Date()
    this._displayName = input.displayName || input.name

    makeAutoObservable(this, {}, { autoBind: true })
  }

  // Getters
  get name(): string {
    return this._name
  }
  get description(): string {
    return this._description
  }
  get members(): RoomMemberType[] {
    return this._members
  }
  get updatedAt(): Date {
    return this._updatedAt
  }
  get displayName(): string {
    return this._displayName
  }

  // Setters
  updateName(newName: string): void {
    this._name = newName
    this._updatedAt = new Date()
  }

  updateDescription(newDescription: string): void {
    this._description = newDescription
    this._updatedAt = new Date()
  }

  updateDisplayName(newDisplayName: string): void {
    this._displayName = newDisplayName
    this._updatedAt = new Date()
  }

  // Update room data from server response
  updateFromServer(roomData: Partial<Room>): void {
    if (roomData.name !== undefined) this._name = roomData.name
    if (roomData.description !== undefined) this._description = roomData.description
    if (roomData.displayName !== undefined) this._displayName = roomData.displayName
    if (roomData.members) this._members = roomData.members
    if (roomData.updatedAt) this._updatedAt = roomData.updatedAt
  }

  // Set members for the room
  setMembers(members: RoomMemberType[]): void {
    this._members = members
    this._updatedAt = new Date()
  }

  // Helper method to check if a user is a member
  isMember(userId: string): boolean {
    return this._members.some((member) => member.id === userId)
  }

  // Get member by user ID
  getMember(userId: string): RoomMemberType | undefined {
    return this._members.find((member) => member.id === userId)
  }

  // Add a member to the room
  addMember(member: RoomMemberType): void {
    if (!this.isMember(member.id)) {
      this._members = [...this._members, member]
      this._updatedAt = new Date()
    }
  }

  // Remove a member from the room
  removeMember(userId: string): void {
    if (this.isMember(userId)) {
      this._members = this._members.filter((member) => member.id !== userId)
      this._updatedAt = new Date()
    }
  }

  // Check if a member exists in the room (alias of isMember for backward compatibility)
  hasMember(memberId: string): boolean {
    return this.isMember(memberId)
  }

  // Update an existing member's information
  updateMember(member: RoomMemberType): void {
    const index = this._members.findIndex((m) => m.id === member.id)
    if (index !== -1) {
      const updatedMembers = [...this._members]
      updatedMembers[index] = member
      this._members = updatedMembers
      this._updatedAt = new Date()
    }
  }

  // Set the last updated timestamp
  setUpdatedAt(updatedAt: Date): void {
    this._updatedAt = updatedAt
  }
}

export default RoomModel
