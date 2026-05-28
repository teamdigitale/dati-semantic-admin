import { Card, CardBody, Icon } from 'design-react-kit'

export default function AuditPage() {
  return (
    <section>
      <h1 className="mb-1">Audit</h1>
      <p className="text-secondary mb-4">
        Delta semantico tra i run di harvesting e changelog degli asset.
      </p>

      <Card className="shadow-sm">
        <CardBody>
          <div className="alert alert-info d-flex align-items-start gap-3 mb-0" role="alert">
            <Icon icon="it-info-circle" size="sm" className="mt-1" />
            <div>
              <strong>In sviluppo.</strong> La vista audit verra' collegata agli endpoint{' '}
              <code>/config/repository/&#123;id&#125;/runs/.../delta</code> non appena avremo
              dati nei repository di test.
            </div>
          </div>
        </CardBody>
      </Card>
    </section>
  )
}
