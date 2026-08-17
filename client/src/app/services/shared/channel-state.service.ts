import { Injectable } from '@angular/core';
import { ChannelService } from '../channel.service';
import { IChannel } from '../../models/channel';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChannelStateService {
  private channelSubject = new BehaviorSubject<IChannel[] | null>(null);
  groupedChannels$ = this.channelSubject.asObservable();
  private currentCommunityId: string | null = null;

  constructor(private channelService: ChannelService) { }

  loadAccessibleChannels(id: string, forceRefresh: boolean = false): Observable<IChannel[] | null> {
    if (!forceRefresh && this.currentCommunityId === id && this.channelSubject.value) {
      // Return a new reference (copy) to force change detection
      return of(this.channelSubject.value ? [...this.channelSubject.value] : null);
    }

    return this.channelService.getAccessibleChannels(id).pipe(
      // Convert the grouped channels object into a single array
      map(groupedChannels => {
        if (!groupedChannels) {
          return null;
        }
        const channels: IChannel[] = Object.values(groupedChannels).flat() as IChannel[];
        return channels;
      }),
      tap(channels => {
        if (channels) {
          // Emit a new copy of the channels array
          this.channelSubject.next([...channels]);
          this.currentCommunityId = id;
        }
      }),
      catchError(error => {
        console.error('Failed to load channels', error);
        return of(null);
      })
    );
  }
}
