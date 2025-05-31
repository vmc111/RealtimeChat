import { makeAutoObservable } from "mobx";
import type { Room, RoomMemberType } from "../../types";


class RoomModel {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly createdAt: Date;
    readonly createdBy: string;
    readonly createdByDisplayName: string;
    readonly isPrivate: boolean;
    private _members: RoomMemberType[];
    private _updatedAt: Date;
    readonly displayName: string;

    constructor(input: Room) {
        this.id = input.id;
        this.name = input.name;
        this.description = input.description || '';
        this.createdAt = input.createdAt;
        this.createdBy = input.createdBy;
        this.createdByDisplayName = input.createdByDisplayName || '';
        this.isPrivate = input.isPrivate;
        this._members = input.members;
        this._updatedAt = input.updatedAt || new Date();
        this.displayName = input.displayName || input.name;

        makeAutoObservable(this, {}, { autoBind: true });
    }       

  
    get members(): RoomMemberType[] { return this._members; }
    get updatedAt(): Date { return this._updatedAt; }

    hasMember(memberId: string): boolean {
        return this._members.some((member) => member.id === memberId);
    }

    addMember(member: RoomMemberType): void {
        const  updatedmemebers = [...this.members, member]
        this._members = updatedmemebers;
    }

    removeMember(memberId: string): void {
        const updatedMembers = this._members.filter((member) => member.id !== memberId);
        this._members = updatedMembers;
    }

    updateMember(member: RoomMemberType): void {
        const index = this._members.findIndex((m) => m.id === member.id);
        if (index !== -1) {
           const updatedMembers = [...this._members];
           updatedMembers[index] = member;
           this._members = updatedMembers;
        }
    }

    setMembers(members: RoomMemberType[]): void {
        this._members = members;
    }

    setUpdatedAt(updatedAt: Date): void {
        this._updatedAt = updatedAt;
    }


}

export default RoomModel;
