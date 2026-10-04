import {
  PageLayout,
  SettingsCard,
  SettingRow,
  PanelHeader,
  PolicyRow,
} from "../common/UI";

import {
  MailIcon,
  DatabaseIcon,
  ShieldIcon,
} from "../common/icons";

export default function Settings({ mails }) {
    <PageLayout
      eyebrow="SYSTEM / SETTINGS"
      title="System Settings"
      description="View CyberGuard services and detection configuration."
    >
      <div className="settings-grid">
        <SettingsCard
          icon={<MailIcon />}
          title="Gmail Monitor"
          description="Email monitoring service"
        >
          <SettingRow label="Status" value="Active" positive />

          <SettingRow label="Scan interval" value="60 seconds" />

          <SettingRow label="Account" value="Connected" />
        </SettingsCard>

        <SettingsCard
          icon={<DatabaseIcon />}
          title="Database"
          description="Quarantine data storage"
        >
          <SettingRow label="Status" value="Connected" positive />

          <SettingRow label="Stored emails" value={mails.length} />

          <SettingRow label="Storage" value="MongoDB" />
        </SettingsCard>

        <SettingsCard
          icon={<ShieldIcon />}
          title="Detection Engine"
          description="Threat analysis configuration"
        >
          <SettingRow label="Status" value="Active" positive />

          <SettingRow label="Malicious threshold" value="70%" />

          <SettingRow label="Analysis" value="Pattern + URL" />
        </SettingsCard>
      </div>

      <section className="panel configuration-panel">
        <PanelHeader
          title="Detection Policy"
          subtitle="Current rules used by the CyberGuard engine"
        />

        <div className="policy-list">
          <PolicyRow
            title="Malicious"
            description="Emails scoring 70% or higher are quarantined."
            color="red"
          />

          <PolicyRow
            title="Suspicious"
            description="Emails scoring between 30% and 69% are classified as suspicious."
            color="yellow"
          />

          <PolicyRow
            title="Safe"
            description="Emails scoring below 30% are classified as safe."
            color="green"
          />
        </div>
      </section>
    </PageLayout>
}
