import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IRole } from '../../../../models/role';
import { RoleService } from '../../../../services/role.service';
import { ToastService } from '../../../../services/toast.service';
import { CommonModalComponent } from '../../../common/common-modal/common-modal.component';
import { PERMISSION_LIST, Permission } from '../../../../constants/permissions';

type Mode = 'list' | 'create' | 'edit';

@Component({
  selector: 'app-roles-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, CommonModalComponent],
  templateUrl: './roles-modal.component.html',
})
export class RolesModalComponent implements OnInit {
  @Input() communityId!: string;
  /** Emitted after any create/update/delete so the parent can refresh community state. */
  @Output() changed = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  readonly permissionList = PERMISSION_LIST;

  roles: IRole[] = [];
  loading = true;
  mode: Mode = 'list';
  saving = false;

  /** Form state for create / edit. */
  form: { name: string; permissions: Set<Permission> } = { name: '', permissions: new Set() };
  editingId: string | null = null;

  roleToDelete: IRole | null = null;

  constructor(
    private roleService: RoleService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.roleService.listRoles(this.communityId).subscribe({
      next: (roles) => { this.roles = roles ?? []; this.loading = false; },
      error: (err: Error) => { this.toast.error(err.message || 'Failed to load roles'); this.loading = false; },
    });
  }

  startCreate(): void {
    this.form = { name: '', permissions: new Set(['VIEW_CONTENT']) };
    this.editingId = null;
    this.mode = 'create';
  }

  startEdit(role: IRole): void {
    this.form = { name: role.name, permissions: new Set(role.permissions as Permission[]) };
    this.editingId = role._id ?? null;
    this.mode = 'edit';
  }

  cancelForm(): void {
    this.mode = 'list';
  }

  togglePermission(key: Permission): void {
    this.form.permissions.has(key) ? this.form.permissions.delete(key) : this.form.permissions.add(key);
  }

  get canSave(): boolean {
    return !this.saving && this.form.name.trim().length > 0 && this.form.permissions.size > 0;
  }

  save(): void {
    if (!this.canSave) return;
    const payload = { name: this.form.name.trim(), permissions: [...this.form.permissions] };
    this.saving = true;
    const req = this.mode === 'edit' && this.editingId
      ? this.roleService.updateRole(this.communityId, this.editingId, payload)
      : this.roleService.createRole(this.communityId, payload);
    req.subscribe({
      next: () => {
        this.saving = false;
        this.mode = 'list';
        this.toast.success(this.editingId ? 'Role updated' : 'Role created');
        this.load();
        this.changed.emit();
      },
      error: (err: Error) => { this.saving = false; this.toast.error(err.message || 'Save failed'); },
    });
  }

  promptDelete(role: IRole): void {
    this.roleToDelete = role;
  }

  confirmDelete(): void {
    const role = this.roleToDelete;
    this.roleToDelete = null;
    if (!role?._id) return;
    this.roleService.deleteRole(this.communityId, role._id).subscribe({
      next: () => {
        this.toast.success('Role deleted');
        this.load();
        this.changed.emit();
      },
      error: (err: Error) => this.toast.error(err.message || 'Delete failed'),
    });
  }

  permissionLabel(key: string): string {
    return this.permissionList.find(p => p.key === key)?.label ?? key;
  }
}
